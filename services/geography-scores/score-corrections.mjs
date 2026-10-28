// User-approved correction, 2026-10-28. Match the original published record
// exactly; future Wizzy runs and every other board/result remain independent.
const corrected=new WeakMap();
export const wizzyNormalCorrection={nickname:'Wizzy',createdAt:1793130153191,before:1001.9,after:901.9};
export async function applyScoreCorrections(db,ranking){
 if(ranking!=='v1:{"game":"mapwiz","difficulties":["easy"]}')return;
 if(!corrected.has(db)){
  const c=wizzyNormalCorrection;
  const work=db.prepare('UPDATE scores SET score=? WHERE board=? AND nickname=? AND created_at=? AND score=?')
   .bind(c.after,ranking,c.nickname,c.createdAt,c.before).run();
  corrected.set(db,work);
  try{await work;}catch(error){corrected.delete(db);throw error;}
 }else await corrected.get(db);
}
