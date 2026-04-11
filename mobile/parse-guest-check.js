const fs = require('fs');
const ts = require('typescript');
const path = 'app/(app)/guest/GuestManagementScreen.tsx';
const src = fs.readFileSync(path, 'utf8');
const res = ts.createSourceFile(path, src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
const diagnostics = res.parseDiagnostics;
if (diagnostics.length === 0) {
  console.log('NO PARSE ERRORS');
} else {
  diagnostics.forEach((d) => {
    console.log(ts.flattenDiagnosticMessageText(d.messageText, '\n'), 'at', d.start, 'len', d.length);
  });
  process.exit(1);
}
