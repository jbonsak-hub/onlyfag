import {emTopic} from './em-spectrum.js?v=20261125-wave-models';
import {atomTopic} from './atom-topic.js?v=20261126-hydrogen';
import {startCourse} from './app.js?v=20261123-lambda';
import {topics as basicTopics} from './wave-basics.js?v=20261125-atom-release';
import {topics as waveTopics} from './waves.js?v=20261125-atom-release';
const params=new URLSearchParams(location.search);
const topics=[...basicTopics,...waveTopics,emTopic,atomTopic];
const topic=topics.some(item=>item.id===params.get('topic'))?params.get('topic'):'bolger';
const view=['fagstoff','oppgaver','begreper'].includes(params.get('view'))?params.get('view'):'fagstoff';
const anchor=params.get('section');
const section=topic==='fenomener'&&view==='fagstoff'&&['interferens','to-spalter'].includes(anchor)?'/'+anchor:'';
if(params.get('embedded')!=='1'){location.replace('../naturfag#waves/'+topic+'/'+view+section);}else{
 history.replaceState(null,'','#'+topic+'/'+view+section);
 startCourse(topics,{embedded:true});
}
