const test=require('node:test');
const assert=require('node:assert/strict');
const {canPlace,hasMove,getCompletedLines,chooseReviveArea}=require('../www/core.js');
const empty=()=>Array.from({length:8},()=>Array(8).fill(null));
test('placement respects board boundaries and occupied tiles',()=>{
  const b=empty(),p=[[0,0],[0,1],[1,0],[1,1]];
  assert.equal(canPlace(b,p,6,6),true);
  assert.equal(canPlace(b,p,7,7),false);
  assert.equal(canPlace(b,p,-1,0),false);
  b[6][6]='blue';assert.equal(canPlace(b,p,6,6),false);
});
test('move availability ignores empty slots',()=>{
  const b=empty();b[0][0]='blue';
  assert.equal(hasMove(b,[null,{c:[[0,0]]}]),true);
  assert.equal(hasMove(Array.from({length:8},()=>Array(8).fill('red')),[{c:[[0,0]]}]),false);
  assert.equal(hasMove(b,[null,null,null]),false);
});
test('clearing row and column counts intersecting cell only once',()=>{
  const b=empty();b[0].fill('blue');for(let r=0;r<8;r++)b[r][0]='blue';
  const result=getCompletedLines(b);
  assert.deepEqual(result.rows,[0]);assert.deepEqual(result.columns,[0]);
  assert.equal(result.linesCount,2);assert.equal(result.cells.length,15);
});
test('revive chooses densest 3x3 region',()=>{
  const b=empty();
  for(let r=5;r<8;r++)for(let c=5;c<8;c++)b[r][c]='amber';
  assert.deepEqual(chooseReviveArea(b),{row:5,col:5,filled:9,size:3});
});
