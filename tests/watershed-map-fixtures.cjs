// Resolve a locally pinned image to the same official grid used by map mocks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/geography/drop-prototype/terrain-cache/manifest.json')));
const sources=new Map(Object.values(manifest.tiles).map(tile=>[tile.file,tile.originalURL]));
exports.terrainSourceURL=url=>{
 const pathname=new URL(url).pathname;if(!pathname.includes('/terrain-cache/'))return null;
 const source=sources.get(path.posix.basename(pathname));assert(source,'Only pinned terrain images are requested');return source;
};
