// Zero-dependency proof for per-exit outcomes. Every check carries a control.
const route = [{id:'a'},{id:'b'},{id:'c'}];
const TAKEN='taken', SKIPPED='skipped', JUMPED='jumped', UNREACHED='unreached';
const STOP_STATUSES=[TAKEN,SKIPPED,JUMPED,UNREACHED];
const isStopStatus=(v)=>STOP_STATUSES.includes(v);
const RANK={[TAKEN]:3,[JUMPED]:2,[SKIPPED]:1,[UNREACHED]:0};
const strongerStatus=(a,b)=>((RANK[b]??0)>(RANK[a]??0)?b:a);
const statusFromDrive=({visited=false,passed=false,jumped=false}={})=>
  jumped?JUMPED:visited?TAKEN:passed?SKIPPED:UNREACHED;

let pass=0, fail=0;
const check=(name,got,want)=>{
  const ok=JSON.stringify(got)===JSON.stringify(want);
  ok?pass++:fail++;
  console.log(`  ${ok?'PASS':'FAIL'}  ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

check('drive says visited -> taken', statusFromDrive({visited:true}), TAKEN);
check('drive says passed -> skipped', statusFromDrive({passed:true}), SKIPPED);
check('deep link -> jumped', statusFromDrive({jumped:true}), JUMPED);
check('nothing -> unreached (control)', statusFromDrive({}), UNREACHED);

// The rule that matters: a later drive-past must NEVER erase a visit.
check('taken beats a later skip', strongerStatus(TAKEN, SKIPPED), TAKEN);
check('CONTROL skip does not beat taken in reverse', strongerStatus(SKIPPED, TAKEN), TAKEN);
check('jumped beats skipped', strongerStatus(SKIPPED, JUMPED), JUMPED);
check('CONTROL taken still beats jumped', strongerStatus(JUMPED, TAKEN), TAKEN);
check('anything beats unreached', strongerStatus(UNREACHED, SKIPPED), SKIPPED);

check('a typo is not a status (control)', isStopStatus('visted'), false);
check('a real one is', isStopStatus(SKIPPED), true);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
