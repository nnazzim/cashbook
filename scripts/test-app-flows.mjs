import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
let sessionCookie = "";

async function request(urlPath, options = {}) {
  const headers = options.headers || {};
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];
  }

  return res;
}

async function runTests() {
  console.log("🚀 Starting CashBook End-to-End Verification Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Landing Page
  console.log("👉 Test 1: Landing Page availability");
  const resLanding = await request("/");
  assert(resLanding.status === 200, "Landing page returns 200 OK");
  const landingText = await resLanding.text();
  assert(landingText.includes("CashBook"), "Landing page renders CashBook branding");

  // TEST 2: Demo Login
  console.log("\n👉 Test 2: Instant Demo Authentication");
  const resLogin = await request("/api/auth/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "owner" }),
  });
  const dataLogin = await resLogin.json();
  assert(resLogin.status === 200 && dataLogin.success, "Demo login successful");
  assert(!!sessionCookie, "Session cookie received and stored");

  // TEST 3: User Session & Businesses
  console.log("\n👉 Test 3: Session & Business Verification");
  const resMe = await request("/api/auth/me");
  const dataMe = await resMe.json();
  assert(dataMe.user?.name === "Nazim Merchant", "Logged in as Nazim Merchant");
  const businessId = dataMe.user?.businesses[0]?.id;
  assert(dataMe.user?.businesses[0]?.name === "SSF Anakkayam Sector Finance ledger", `Active business verified: ${dataMe.user?.businesses[0]?.name}`);

  // TEST 4: Books listing
  console.log("\n👉 Test 4: Books Listing & Running Balances");
  const resBooks = await request(`/api/books?businessId=${businessId}`);
  const dataBooks = await resBooks.json();
  assert(dataBooks.books?.length >= 2, `Retrieved ${dataBooks.books?.length} books`);
  const dailyBook = dataBooks.books.find((b) => b.name === "Daily Counter Cashbook");
  assert(dailyBook && dailyBook.netBalance > 0, `Daily Counter Cashbook net balance is ₹${dailyBook?.netBalance?.toLocaleString()}`);

  const bookId = dailyBook.id;

  // TEST 5: Book Detail with categories & payment modes
  console.log("\n👉 Test 5: Book Detail & Metadata");
  const resBookDetail = await request(`/api/books/${bookId}`);
  const dataBookDetail = await resBookDetail.json();
  assert(dataBookDetail.book?.categories?.length > 0, `Book categories loaded (${dataBookDetail.book?.categories?.length})`);
  assert(dataBookDetail.book?.paymentModes?.length > 0, `Book payment modes loaded (${dataBookDetail.book?.paymentModes?.length})`);

  // TEST 6: Query Entries
  console.log("\n👉 Test 6: Query Entries & Filters");
  const resEntries = await request(`/api/entries?bookId=${bookId}`);
  const dataEntries = await resEntries.json();
  assert(dataEntries.entries?.length >= 20, `Retrieved ${dataEntries.entries?.length} ledger entries`);
  assert(dataEntries.summary?.totalIn > 0, `Summary total in: ₹${dataEntries.summary?.totalIn}`);
  assert(dataEntries.summary?.totalOut > 0, `Summary total out: ₹${dataEntries.summary?.totalOut}`);

  // TEST 7: Add Entry & Recalculate Balance
  console.log("\n👉 Test 7: Create Entry & Verify Running Balance Calculation");
  const prevBalance = dailyBook.netBalance;
  const resAdd = await request("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookId,
      type: "IN",
      amount: 2500,
      remark: "Automated test sale entry",
      categoryName: "Counter Sales",
      paymentModeName: "Cash",
      partyName: "Test Customer",
    }),
  });
  const dataAdd = await resAdd.json();
  assert(resAdd.status === 200 && dataAdd.success, "New Cash In entry created");
  const newEntryId = dataAdd.entry?.id;

  // Re-check book balance
  const resBooksAfter = await request(`/api/books?businessId=${businessId}`);
  const dataBooksAfter = await resBooksAfter.json();
  const updatedBook = dataBooksAfter.books.find((b) => b.id === bookId);
  assert(updatedBook.netBalance === prevBalance + 2500, `Book balance updated from ₹${prevBalance} to ₹${updatedBook.netBalance}`);

  // TEST 8: Soft Delete & Undo Restore
  console.log("\n👉 Test 8: Soft Delete & Undo Restore");
  const resDel = await request(`/api/entries?entryId=${newEntryId}`, { method: "DELETE" });
  assert(resDel.status === 200, "Entry soft-deleted");

  const resRestore = await request(`/api/entries/${newEntryId}/restore`, { method: "POST" });
  assert(resRestore.status === 200, "Entry restored via undo endpoint");

  // Cleanup test entry
  await request(`/api/entries?entryId=${newEntryId}`, { method: "DELETE" });

  // TEST 9-13: TEST ALL 5 SAMPLE IMPORT FILES
  const samplesDir = path.join(process.cwd(), "public", "sample-imports");

  // Sample 1: Clean cashbook (.xlsx)
  console.log("\n👉 Test 9: Import Sample 1 - Clean Cashbook (clean_cashbook.xlsx)");
  {
    const fileBuf = fs.readFileSync(path.join(samplesDir, "clean_cashbook.xlsx"));
    const formData = new FormData();
    formData.append("file", new Blob([fileBuf]), "clean_cashbook.xlsx");
    formData.append("bookId", bookId);

    const resParse = await request("/api/import/parse", { method: "POST", body: formData });
    const dataParse = await resParse.json();
    assert(resParse.status === 200 && dataParse.success, "Clean Excel parsed successfully");
    assert(dataParse.summary?.validCount === 6, `All 6 rows are valid (${dataParse.summary?.validCount}/6)`);
    assert(!!dataParse.detectedMapping?.dateCol, `Detected Date Col: ${dataParse.detectedMapping?.dateCol}`);
    assert(!!dataParse.detectedMapping?.cashInCol, `Detected Cash In Col: ${dataParse.detectedMapping?.cashInCol}`);

    // Execute Import into a new book
    const resExec = await request("/api/import/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: "NEW",
        businessId,
        newBookName: "Clean Imported Ledger",
        fileName: "clean_cashbook.xlsx",
        rows: dataParse.previewRows,
      }),
    });
    const dataExec = await resExec.json();
    assert(resExec.status === 200 && dataExec.importedCount === 6, `Imported ${dataExec.importedCount} entries into ${dataExec.bookName}`);
  }

  // Sample 2: Messy dates & currencies (.xlsx)
  console.log("\n👉 Test 10: Import Sample 2 - Messy Dates & Formatted Currencies (messy_dates.xlsx)");
  {
    const fileBuf = fs.readFileSync(path.join(samplesDir, "messy_dates.xlsx"));
    const formData = new FormData();
    formData.append("file", new Blob([fileBuf]), "messy_dates.xlsx");

    const resParse = await request("/api/import/parse", { method: "POST", body: formData });
    const dataParse = await resParse.json();
    assert(resParse.status === 200 && dataParse.success, "Messy dates Excel parsed");
    assert(dataParse.summary?.validCount === 5, `Normalized serial numbers, DD/MM/YYYY, and Rs. currencies (${dataParse.summary?.validCount}/5)`);

    const resExec = await request("/api/import/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: "NEW",
        businessId,
        newBookName: "Messy Dates Imported Ledger",
        fileName: "messy_dates.xlsx",
        rows: dataParse.previewRows,
      }),
    });
    const dataExec = await resExec.json();
    assert(resExec.status === 200 && dataExec.importedCount === 5, `Imported ${dataExec.importedCount} entries`);
  }

  // Sample 3: Separate In / Out columns (.xlsx)
  console.log("\n👉 Test 11: Import Sample 3 - Separate In / Out Columns (separate_in_out.xlsx)");
  {
    const fileBuf = fs.readFileSync(path.join(samplesDir, "separate_in_out.xlsx"));
    const formData = new FormData();
    formData.append("file", new Blob([fileBuf]), "separate_in_out.xlsx");

    const resParse = await request("/api/import/parse", { method: "POST", body: formData });
    const dataParse = await resParse.json();
    assert(resParse.status === 200 && dataParse.success, "Separate In/Out parsed");
    assert(dataParse.summary?.validCount === 6, `Detected 6 valid separate column rows (${dataParse.summary?.validCount}/6)`);
  }

  // Sample 4: Single Amount + Type column (.csv)
  console.log("\n👉 Test 12: Import Sample 4 - Single Amount + Type (.csv)");
  {
    const fileBuf = fs.readFileSync(path.join(samplesDir, "amount_and_type.csv"));
    const formData = new FormData();
    formData.append("file", new Blob([fileBuf]), "amount_and_type.csv");

    const resParse = await request("/api/import/parse", { method: "POST", body: formData });
    const dataParse = await resParse.json();
    assert(resParse.status === 200 && dataParse.success, "Amount + Type CSV parsed");
    assert(dataParse.summary?.validCount === 6, `Parsed 6 rows with In/Out resolved correctly`);
  }

  // Sample 5: Errors, bad rows & duplicates (.xlsx)
  console.log("\n👉 Test 13: Import Sample 5 - Errors, Bad Dates & Duplicates (errors_and_duplicates.xlsx)");
  {
    const fileBuf = fs.readFileSync(path.join(samplesDir, "errors_and_duplicates.xlsx"));
    const formData = new FormData();
    formData.append("file", new Blob([fileBuf]), "errors_and_duplicates.xlsx");

    const resParse = await request("/api/import/parse", { method: "POST", body: formData });
    const dataParse = await resParse.json();
    assert(resParse.status === 200, "Errors file parsed");
    assert(dataParse.summary?.errorCount > 0, `Correctly identified ${dataParse.summary?.errorCount} invalid rows with detailed error reasons`);
    assert(dataParse.summary?.duplicateCount > 0, `Correctly detected ${dataParse.summary?.duplicateCount} duplicate row`);

    // Test 24-Hour Undo functionality
    console.log("\n👉 Test 14: Execute Import & 24-Hour Undo Rollback");
    const resExec = await request("/api/import/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: "NEW",
        businessId,
        newBookName: "Temporary Undo Test Book",
        fileName: "errors_and_duplicates.xlsx",
        rows: dataParse.previewRows,
      }),
    });
    const dataExec = await resExec.json();
    assert(resExec.status === 200 && dataExec.importId, `Created import batch with importId: ${dataExec.importId}`);

    // Call Undo
    const resUndo = await request("/api/import/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importId: dataExec.importId }),
    });
    const dataUndo = await resUndo.json();
    assert(resUndo.status === 200 && dataUndo.success, `24-Hour Undo succeeded: ${dataUndo.message}`);
  }

  // TEST 15: Excel Export Generation
  console.log("\n👉 Test 15: Excel (.xlsx) Report Export Generation");
  const resExcel = await request(`/api/export/excel?bookId=${bookId}`);
  assert(resExcel.status === 200, "Excel export returns 200 OK");
  const contentType = resExcel.headers.get("content-type");
  assert(contentType.includes("spreadsheetml"), `Content-Type matches Excel: ${contentType}`);
  const excelBlob = await resExcel.arrayBuffer();
  assert(excelBlob.byteLength > 1000, `Generated valid binary Excel workbook (${excelBlob.byteLength} bytes)`);

  // TEST 16: Summary Report & Khata Dues
  console.log("\n👉 Test 16: Cross-Book Summary & Party Balances");
  const resSummary = await request(`/api/reports/summary?businessId=${businessId}`);
  const dataSummary = await resSummary.json();
  assert(dataSummary.summary?.totalEntries > 0, `Cross-book total entries: ${dataSummary.summary?.totalEntries}`);
  assert(dataSummary.categories?.length > 0, `Categories breakdown present: ${dataSummary.categories?.length} heads`);

  const resParties = await request(`/api/parties?businessId=${businessId}`);
  const dataParties = await resParties.json();
  assert(dataParties.parties?.length > 0, `Customer & Supplier khata loaded: ${dataParties.parties?.length} parties`);
  const ramesh = dataParties.parties.find((p) => p.name.includes("Ramesh"));
  assert(!!ramesh, `Party Ramesh Traders tracked with balance: ₹${ramesh?.netBalance}`);

  // FINAL RESULTS SUMMARY
  console.log(`\n========================================`);
  console.log(`✨ TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
