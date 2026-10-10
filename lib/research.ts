export type Video={id:string;title:string;channel:string;views:number;subs:number;likes:number;ageHours:number;duration:string;cover?:string;thumb?:string;url?:string};
export const compact=(n:number)=>n>=10000?`${(n/10000).toFixed(1)}万`:n.toLocaleString('ja-JP');
export const hourly=(v:Video)=>v.views/Math.max(1,v.ageHours);
export const subscriberRatio=(v:Video)=>v.subs>0?v.views/v.subs:0;
export const demoVideos:Video[]=[
{id:'demo1',title:'AIで仕事はここまで変わる。毎日使っている活用法7選',channel:'AI WORK LAB（サンプル）',views:186400,subs:32400,likes:5320,ageHours:20,duration:'18:42',cover:'仕事が変わる\nAI活用 7選'},
{id:'demo2',title:'【検証】NotebookLMで資料作成。1時間の作業は何分になる？',channel:'つくる、はたらく（サンプル）',views:92300,subs:18200,likes:2460,ageHours:16,duration:'14:08',cover:'NotebookLM\n実力を検証'},
{id:'demo3',title:'もう手作業に戻れない。Claudeで始める業務自動化',channel:'デジタル仕事術（サンプル）',views:148000,subs:68000,likes:3910,ageHours:42,duration:'22:15',cover:'Claude\n自動化の第一歩'},
{id:'demo4',title:'ChatGPTの使い方、見直してみた。初心者が試す5つのコツ',channel:'AI WORK LAB（サンプル）',views:68400,subs:32400,likes:1830,ageHours:30,duration:'12:36',cover:'ChatGPT\n使い方を更新。'},
{id:'demo5',title:'無料AIツールだけで動画を作ってみた【制作の全工程】',channel:'クリエイター実験室（サンプル）',views:119000,subs:23100,likes:3140,ageHours:68,duration:'26:04',cover:'AI × VIDEO\nゼロから作る'},
{id:'demo6',title:'GeminiとChatGPT、実際の仕事で比較してみました',channel:'つくる、はたらく（サンプル）',views:83200,subs:18200,likes:1740,ageHours:96,duration:'16:50',cover:'Gemini\nvs ChatGPT'}];
export async function searchVideos(key:string,q:string,days:number):Promise<Video[]>{
 async function api(path:string,params:Record<string,string>){const res=await fetch('https://www.googleapis.com/youtube/v3/'+path+'?'+new URLSearchParams({...params,key}),{signal:AbortSignal.timeout(30000)});const body=await res.json();if(!res.ok){const reason=body.error?.errors?.[0]?.reason;throw new Error(reason==='quotaExceeded'?'APIの利用上限に達しました。時間をおいて再度お試しください。':res.status===400||res.status===403?'APIキー・APIの有効化・アクセス制限の設定を確認してください。':'YouTubeからデータを取得できませんでした。')}return body.items||[];}
 const found=await api('search',{part:'snippet',q,type:'video',regionCode:'JP',relevanceLanguage:'ja',maxResults:'50',order:'viewCount',publishedAfter:new Date(Date.now()-days*86400000).toISOString()});if(!found.length)return [];
 const vd=await api('videos',{part:'snippet,statistics,contentDetails',id:found.map((v:any)=>v.id.videoId).join(',')});const cd=await api('channels',{part:'statistics',id:Array.from(new Set(vd.map((v:any)=>v.snippet.channelId))).join(',')});const channels=new Map(cd.map((c:any)=>[c.id,c.statistics]));
 return vd.map((v:any)=>{const c:any=channels.get(v.snippet.channelId);const match=v.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);const secs=match?Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]||0):0;return {id:v.id,title:v.snippet.title,channel:v.snippet.channelTitle,views:Number(v.statistics.viewCount||0),subs:c?.hiddenSubscriberCount?0:Number(c?.subscriberCount||0),likes:Number(v.statistics.likeCount||0),ageHours:Math.max(1,(Date.now()-Date.parse(v.snippet.publishedAt))/3600000),duration:`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`,thumb:v.snippet.thumbnails.medium?.url,url:'https://www.youtube.com/watch?v='+v.id}});
}
