/* Game rules, independent from the browser and unit-testable. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.BlockPuzzleCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const dimensions=cells=>({rows:Math.max(...cells.map(([r])=>r))+1,cols:Math.max(...cells.map(([,c])=>c))+1});
  function canPlace(board,cells,row,col){
    if(!Array.isArray(cells)||!cells.length||!Number.isInteger(row)||!Number.isInteger(col))return false;
    const height=board.length,width=board[0]?.length||0;
    return cells.every(([dr,dc])=>{
      const r=row+dr,c=col+dc;
      return Number.isInteger(dr)&&Number.isInteger(dc)&&r>=0&&r<height&&c>=0&&c<width&&!board[r][c];
    });
  }
  function hasMove(board,shapes){
    const height=board.length,width=board[0]?.length||0;
    return shapes.some(shape=>{
      if(!shape?.c?.length)return false;
      const {rows,cols}=dimensions(shape.c);
      for(let r=0;r<=height-rows;r++)for(let c=0;c<=width-cols;c++)if(canPlace(board,shape.c,r,c))return true;
      return false;
    });
  }
  function getCompletedLines(board){
    const height=board.length,width=board[0]?.length||0;
    const rows=[],columns=[],distinct=new Map();
    for(let r=0;r<height;r++)if(board[r].every(Boolean))rows.push(r);
    for(let c=0;c<width;c++)if(board.every(row=>Boolean(row[c])))columns.push(c);
    rows.forEach(r=>{for(let c=0;c<width;c++)distinct.set(r+','+c,[r,c]);});
    columns.forEach(c=>{for(let r=0;r<height;r++)distinct.set(r+','+c,[r,c]);});
    return {rows,columns,linesCount:rows.length+columns.length,cells:[...distinct.values()]};
  }
  function chooseReviveArea(board,size=3){
    const height=board.length,width=board[0]?.length||0,span=Math.min(size,height,width);
    if(!span||span<1)return null;
    let best={row:0,col:0,filled:-1,size:span};
    for(let r=0;r<=height-span;r++)for(let c=0;c<=width-span;c++){
      let filled=0;
      for(let y=0;y<span;y++)for(let x=0;x<span;x++)if(board[r+y][c+x])filled++;
      if(filled>best.filled)best={row:r,col:c,filled,size:span};
    }
    return best;
  }
  return Object.freeze({canPlace,hasMove,getCompletedLines,chooseReviveArea});
});
