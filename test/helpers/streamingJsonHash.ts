import {createHash} from 'node:crypto';
/** The source fixture is an ordered array of plain JSON entries. Hash precisely
 * the same UTF8 bytes without allocating one concatenated catalog-size string.
 * Nested object/array order and JSON.stringify's omission/null rules stay intact.
 */
export function streamingJsonSha256(value:unknown):string{
 const hash=createHash('sha256');
 if(Array.isArray(value)){
  hash.update('[');for(let index=0;index<value.length;index++){if(index)hash.update(',');hash.update(JSON.stringify(value[index])??'null');}hash.update(']');
 }else hash.update(JSON.stringify(value));
 return hash.digest('hex');
}
