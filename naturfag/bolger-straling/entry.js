import {emTopic} from './em-spectrum.js?v=20261121-spectrum1';
import {startCourse} from './app.js?v=20261121-spectrum1';
import {topics as basicTopics} from './wave-basics.js?v=20261118-resonans1';
import {topics as waveTopics} from './waves.js?v=20261121-spectrum1';
const params=new URLSearchParams(location.search);
const topic=['bolger','fenomener','em'].includes(params.get('topic'))?params.get('topic'):'bolger';
const view=['fagstoff','oppgaver','begreper'].includes(params.get('view'))?params.get('view'):'fagstoff';
if(params.get('embedded')!=='1'){location.replace('../naturfag#waves/'+topic+'/'+view);}else{
 history.replaceState(null,'','#'+topic+'/'+view);
 startCourse([...basicTopics,...waveTopics,emTopic],{embedded:true});
}
