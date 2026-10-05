import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {StatusBar} from 'expo-status-bar';

Notifications.setNotificationHandler({handleNotification: async () => ({shouldShowBanner:true, shouldShowList:true, shouldPlaySound:false})});

const PUZZLES = [
 {q:'У тебя 3 яблока. Ты взял 2. Сколько яблок у тебя?', a:['1','2','3','5'], correct:1},
 {q:'Продолжи ряд: 2, 4, 8, 16, ?', a:['20','24','30','32'], correct:3},
 {q:'Что тяжелее: 1 кг железа или 1 кг кирпичей?', a:['Железо','Кирпичи','Одинаково','Зависит от размера'], correct:2},
 {q:'У отца 3 сына: Ян, Макс и… как зовут третьего?', a:['Вадим','Третьего','Нельзя узнать','Отец'], correct:1},
 {q:'Если сегодня понедельник, какой день будет через 10 дней?', a:['Среда','Четверг','Пятница','Суббота'], correct:1}
];
const FACTS = [
 'В 1957 году СССР запустил «Спутник-1» — первый искусственный спутник Земли.',
 'В 1969 году состоялась первая высадка людей на Луне.',
 'В 1886 году был создан первый современный автомобиль с бензиновым двигателем.',
 'В 1991 году Украина провозгласила независимость.',
 'В 1989 году пала Берлинская стена — один из символов окончания холодной войны.'
];
const MEDALS = [
 ['Старт','7 дней','Ты доказал себе, что можешь начать.'],
 ['Разгон','14 дней','Две недели — это уже не случайность.'],
 ['Стальной характер','21 день','Ты строишь новую привычку день за днём.'],
 ['Чёрный пояс','28 дней','Месяц силы. Продолжай в своём темпе.'],
 ['Легенда','30+ дней','Ты уже не считаешь дни — дни работают на тебя.']
];

const dayKey = d => d.toISOString().slice(0,10);
function App(){
 const [days,setDays]=useState([]); const [tab,setTab]=useState('home'); const [selected,setSelected]=useState(null); const [ready,setReady]=useState(false);
 const today=dayKey(new Date());
 useEffect(()=>{(async()=>{const raw=await AsyncStorage.getItem('soberDays'); if(raw)setDays(JSON.parse(raw)); await scheduleReminder(); setReady(true)})()},[]);
 const streak=useMemo(()=>{let n=0; let d=new Date(); while(days.includes(dayKey(d))){n++;d.setDate(d.getDate()-1)} return n},[days]);
 const puzzle=PUZZLES[(new Date().getDate()-1)%PUZZLES.length];
 const fact=FACTS[(new Date().getDate()-1)%FACTS.length];
 async function mark(){
   if(selected!==puzzle.correct){Alert.alert('Почти!','Попробуй ещё раз.');return}
   if(!days.includes(today)){const next=[...days,today]; setDays(next); await AsyncStorage.setItem('soberDays',JSON.stringify(next));}
   setSelected(null); Alert.alert('День забран!','Ещё один день трезвости — твой. 💪');
 }
 if(!ready)return <View style={s.loading}><Text style={s.logo}>SOBER//STREAK</Text></View>;
 return <View style={s.root}><StatusBar style="light"/>
   <ScrollView contentContainerStyle={s.scroll}>
    <Text style={s.logo}>SOBER<Text style={s.graffiti}>//</Text>STREAK</Text>
    {tab==='home' && <>
      <View style={s.hero}><Text style={s.kicker}>ТВОЯ СЕРИЯ</Text><Text style={s.number}>{streak}</Text><Text style={s.days}>ДНЕЙ БЕЗ АЛКОГОЛЯ</Text><View style={s.tag}><Text style={s.tagText}>{streak===0?'Начни сегодня':`До следующей медали: ${7-(streak%7||7)} дней`}</Text></View></View>
      <View style={s.card}><Text style={s.cardLabel}>ИСПЫТАНИЕ ДНЯ</Text><Text style={s.question}>{puzzle.q}</Text>{puzzle.a.map((x,i)=><Pressable key={x} onPress={()=>setSelected(i)} style={[s.answer,selected===i&&s.answerOn]}><Text style={s.answerText}>{x}</Text></Pressable>)}<Pressable onPress={mark} style={s.button}><Text style={s.buttonText}>ЗАБРАТЬ ДЕНЬ →</Text></Pressable></View>
      <View style={s.fact}><Text style={s.cardLabel}>ИСТОРИЯ СЕГОДНЯ</Text><Text style={s.factText}>{fact}</Text></View>
    </>}
    {tab==='medals' && <><Text style={s.title}>МЕДАЛИ</Text>{MEDALS.map((m,i)=><View key={m[0]} style={[s.medal, streak >= (i+1)*7 && s.medalEarned]}><Text style={s.medalIcon}>{streak >= (i+1)*7?'★':'○'}</Text><View><Text style={s.medalName}>{m[0]}</Text><Text style={s.medalDays}>{m[1]}</Text><Text style={s.medalText}>{m[2]}</Text></View></View>)}</>}
    {tab==='settings' && <><Text style={s.title}>НАСТРОЙКИ</Text><View style={s.card}><Text style={s.question}>Напоминание</Text><Text style={s.factText}>Каждый день в 21:00 приложение напоминает пройти испытание.</Text><Pressable style={s.button} onPress={scheduleReminder}><Text style={s.buttonText}>ВКЛЮЧИТЬ 21:00</Text></Pressable></View><Text style={s.small}>Это приложение — инструмент поддержки, а не медицинская помощь. Если тебе тяжело остановиться самостоятельно, обратись к врачу или в службу помощи.</Text></>}
   </ScrollView>
   <View style={s.nav}>{[['home','●','ДЕНЬ'],['medals','★','МЕДАЛИ'],['settings','⚙','ЕЩЁ']].map(([id,icon,label])=><Pressable key={id} onPress={()=>setTab(id)} style={s.navItem}><Text style={[s.navIcon,tab===id&&s.active]}>{icon}</Text><Text style={[s.navText,tab===id&&s.active]}>{label}</Text></Pressable>)}</View>
 </View>
}
async function scheduleReminder(){try{const p=await Notifications.getPermissionsAsync(); if(!p.granted){const r=await Notifications.requestPermissionsAsync(); if(!r.granted)return;} await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({content:{title:'SOBER//STREAK',body:'Твой сегодняшний день ждёт. Пройди испытание и забери его. 💪'},trigger:{hour:21,minute:0,repeats:true}})}catch(e){}}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#101010'},scroll:{padding:22,paddingBottom:110},loading:{flex:1,backgroundColor:'#101010',alignItems:'center',justifyContent:'center'},logo:{color:'#f4f0e8',fontSize:25,fontWeight:'900',letterSpacing:1},graffiti:{color:'#ff4d00'},hero:{marginTop:25,borderWidth:1,borderColor:'#333',padding:24,backgroundColor:'#171717'},kicker:{color:'#ff4d00',fontSize:12,fontWeight:'800',letterSpacing:2},number:{color:'#f4f0e8',fontSize:92,fontWeight:'900',lineHeight:100},days:{color:'#aaa',fontSize:14,fontWeight:'800',letterSpacing:2},tag:{marginTop:20,backgroundColor:'#252525',padding:10,alignSelf:'flex-start'},tagText:{color:'#fff',fontSize:12,fontWeight:'700'},card:{marginTop:16,padding:20,backgroundColor:'#191919',borderWidth:1,borderColor:'#292929'},cardLabel:{color:'#ff4d00',fontSize:11,fontWeight:'900',letterSpacing:2,marginBottom:12},question:{color:'#fff',fontSize:20,fontWeight:'800',lineHeight:28,marginBottom:15},answer:{borderWidth:1,borderColor:'#333',padding:14,marginTop:8},answerOn:{borderColor:'#ff4d00',backgroundColor:'#24150f'},answerText:{color:'#ddd',fontSize:15,fontWeight:'700'},button:{marginTop:18,backgroundColor:'#f4f0e8',padding:16,alignItems:'center'},buttonText:{color:'#111',fontWeight:'900',letterSpacing:1},fact:{marginTop:16,padding:20,borderLeftWidth:3,borderLeftColor:'#ff4d00',backgroundColor:'#171717'},factText:{color:'#ddd',fontSize:16,lineHeight:24},title:{color:'#fff',fontSize:34,fontWeight:'900',marginTop:28,marginBottom:10},medal:{marginTop:10,padding:18,backgroundColor:'#191919',flexDirection:'row',gap:16,opacity:.45},medalEarned:{opacity:1,borderWidth:1,borderColor:'#333'},medalIcon:{fontSize:35,color:'#ff4d00'},medalName:{color:'#fff',fontSize:19,fontWeight:'900'},medalDays:{color:'#ff4d00',fontSize:11,fontWeight:'800',marginTop:3},medalText:{color:'#aaa',fontSize:13,marginTop:7},small:{color:'#777',fontSize:12,lineHeight:18,marginTop:20},nav:{position:'absolute',bottom:0,left:0,right:0,height:82,backgroundColor:'#151515',borderTopWidth:1,borderTopColor:'#292929',flexDirection:'row'},navItem:{flex:1,alignItems:'center',justifyContent:'center'},navIcon:{color:'#666',fontSize:20},navText:{color:'#666',fontSize:10,fontWeight:'800',marginTop:5},active:{color:'#ff4d00'}});
export default App;
