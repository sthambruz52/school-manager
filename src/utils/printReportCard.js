import { formatNaira } from "../theme";

export function gradeInfo(pct) {
  if (pct >= 70) return { letter: "A", label: "Excellent" };
  if (pct >= 60) return { letter: "B", label: "Very Good" };
  if (pct >= 50) return { letter: "C", label: "Good" };
  if (pct >= 40) return { letter: "D", label: "Fair" };
  return { letter: "F", label: "Poor" };
}

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const safeUrl = (u) => (typeof u === "string" && /^https:\/\//i.test(u) ? esc(u) : "");

const prettyDate = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
};

export function printReportCard(d) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(d.accent || "") ? d.accent : "#1f4d3a";
  const origin = window.location.origin;
  const school = d.school || {};
  const contact = d.contact || {};
  const s = d.student || {};

  const subjectRows = d.subjects.length
    ? d.subjects.map((x) => {
        const comps = x.entries
          .map((e) => `${esc(e.testType || "Exam")} ${Number(e.score)}/${Number(e.maxScore)}`)
          .join(" &bull; ");
        return `<tr>
          <td><strong>${esc(x.subject)}</strong><div class="comp">${comps}</div></td>
          <td class="c">${x.totalScore}/${x.totalMax}</td>
          <td class="c">${x.pct}%</td>
          <td class="c"><strong>${x.letter}</strong></td>
          <td>${esc(x.label)}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="5" class="c">No grades recorded for this period.</td></tr>`;

  const overall = gradeInfo(d.average);
  const photo = safeUrl(s.photoURL);
  const contactLine = [contact.address, contact.phone1, contact.email].filter(Boolean).map(esc).join(" &nbsp;|&nbsp; ");

  const attendanceText = d.attendance && d.attendance.total > 0
    ? `${d.attendance.present} of ${d.attendance.total} days present (${d.attendance.pct}%)`
    : "No attendance records for this period";

  const feesBlock = d.fees
    ? `<div class="box"><strong>Fees:</strong> Paid ${esc(formatNaira(d.fees.paid))} of ${esc(formatNaira(d.fees.billed))} &nbsp;|&nbsp; Balance <strong>${esc(formatNaira(d.fees.balance))}</strong></div>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Report Card - ${esc(s.fullName)}</title>
  <style>
    @page { margin: 12mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, sans-serif; color: #222; max-width: 780px; margin: 0 auto; padding: 16px; }
    .head { display: flex; align-items: center; gap: 16px; border-bottom: 4px solid ${accent}; padding-bottom: 12px; }
    .logo { width: 70px; height: 70px; object-fit: contain; }
    .head h1 { margin: 0; font-size: 22px; color: ${accent}; text-transform: uppercase; }
    .head p { margin: 2px 0 0; font-size: 12px; color: #555; }
    h2 { text-align: center; letter-spacing: 2px; font-size: 16px; margin: 16px 0 10px; }
    .student { display: flex; gap: 16px; align-items: center; border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
    .photo { width: 80px; height: 100px; object-fit: cover; border-radius: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; font-size: 13px; flex: 1; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
    th { background: ${accent}; color: white; text-align: left; padding: 8px; }
    td { border-bottom: 1px solid #ddd; padding: 8px; vertical-align: top; }
    .c { text-align: center; }
    .comp { font-size: 11px; color: #777; margin-top: 2px; }
    .box { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; margin-top: 10px; font-size: 13px; }
    .sign { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; }
    .sign div { width: 40%; border-top: 1px solid #555; padding-top: 4px; text-align: center; }
    .foot { text-align: center; font-size: 11px; color: #777; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="head">
    <img class="logo" src="${origin}/logo.jpg" alt="" />
    <div>
      <h1>${esc(school.schoolName || "School Report")}</h1>
      <p>${esc(school.tagline || "")}</p>
      <p>${contactLine}</p>
    </div>
  </div>

  <h2>TERMLY REPORT CARD</h2>

  <div class="student">
    ${photo ? `<img class="photo" src="${photo}" alt="" />` : ""}
    <div class="grid">
      <div><strong>Name:</strong> ${esc(s.fullName)}</div>
      <div><strong>Class:</strong> ${esc(s.classLevel || "-")}</div>
      <div><strong>Reg. No:</strong> ${esc(s.regNumber || "-")}</div>
      <div><strong>Sex:</strong> ${esc(s.sex || "-")}</div>
      <div><strong>Session:</strong> ${esc(d.session || "-")}</div>
      <div><strong>Term:</strong> ${esc(d.term || "-")}</div>
      <div><strong>Date of Birth:</strong> ${esc(prettyDate(s.dateOfBirth))}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Subject</th><th class="c">Total</th><th class="c">%</th><th class="c">Grade</th><th>Remark</th></tr>
    </thead>
    <tbody>${subjectRows}</tbody>
  </table>

  <div class="box"><strong>Overall Average:</strong> ${d.average}% &nbsp;|&nbsp; Grade <strong>${overall.letter}</strong> (${overall.label}) &nbsp;|&nbsp; ${d.subjects.length} subject(s)</div>
  <div class="box"><strong>Attendance:</strong> ${esc(attendanceText)}</div>
  ${feesBlock}
  <div class="box"><strong>Class Teacher's Remark:</strong><br />${esc(d.remark || "No remark yet.")}</div>

  <div class="sign"><div>Class Teacher</div><div>Principal</div></div>
  <div class="foot">Developed by EPIC TRIBE RESOURCES INT.</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups for this site, then try again.");
    return;
  }
  w.document.write(html);
  w.document.close();

  let printed = false;
  const go = () => {
    if (printed) return;
    printed = true;
    w.focus();
    w.print();
  };
  w.onload = go;
  setTimeout(go, 2000);
}