import {startCourse} from './app.js?v=20261116-naturfag1';
import {topics as basicTopics} from './wave-basics.js?v=20261116-naturfag1';
import {topics as waveTopics} from './waves.js?v=20261116-naturfag1';
const params=new URLSearchParams(location.search);
const topic=['bolger','fenomener'].includes(params.get('topic'))?params.get('topic'):'bolger';
const view=['fagstoff','oppgaver','begreper'].includes(params.get('view'))?params.get('view'):'fagstoff';
if(params.get('embedded')!=='1'){location.replace('../naturfag#waves/'+topic+'/'+view);}else{
 history.replaceState(null,'','#'+topic+'/'+view);
 startCourse([...basicTopics,...waveTopics],{embedded:true});
}
