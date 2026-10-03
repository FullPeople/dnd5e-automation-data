"""Generate the reviewable JSON Schemas from bounded declarative definitions."""
import json
from pathlib import Path
S=lambda **kw: {'type':'string','minLength':1,'maxLength':1000,**kw}
N=lambda lo=0,hi=10000: {'type':'integer','minimum':lo,'maximum':hi}
E=lambda *values: {'enum':list(values)}
R=lambda name: {'$ref':'#/$defs/'+name}
A=lambda item,minimum=0,maximum=10000: {'type':'array','items':item,'minItems':minimum,'maxItems':maximum}
O=lambda props,required=[]: {'type':'object','properties':props,'required':required,'additionalProperties':False}
F=S(maxLength=160)
B={'type':'boolean'}
amount={'oneOf':[O({'value':N()},['value']),O({'formula':F},['formula'])]}
ability=E('str','dex','con','int','wis','cha')
target=S(pattern=r'^(str|dex|con|int|wis|cha|ac|hp|initiative|proficiency|passive|criticalDice|size|cantrips|speed\.(walk|fly|swim|climb|burrow|hover)|skill:[a-z][a-zA-Z-]*|save:(str|dex|con|int|wis|cha)|resist:[a-z]+|immune:[a-z]+|vulnerable:[a-z]+|conditionImmune:[a-z-]+|sense:[a-z]+|attack\.(melee|ranged|spell|spellMelee|spellRanged)|damage\.(melee|ranged|spell|spellMelee|spellRanged)|dc\.spell)$')
scalar={'oneOf':[{'type':'number','minimum':-1000000,'maximum':1000000},B,S(maxLength=160)]}
defs={
 'identity':O({'kind':S(pattern=r'^[A-Za-z][A-Za-z0-9]*$'),'source':S(pattern=r'^[A-Z0-9][A-Z0-9_:-]*$'),'engName':S(),'packId':S(pattern=r'^[a-zA-Z0-9_-]+$'),'classSource':S(),'classEngName':S(),'subclassSource':S(),'subclassEngShortName':S(),'raceSource':S(),'raceEngName':S(),'level':N(0,20),'extra':S(),'key':S(maxLength=6000)},['kind','source','engName','key']),
 'amount':amount,
 'condition':{'oneOf':[O({'all':A(R('condition'),1,50)},['all']),O({'any':A(R('condition'),1,50)},['any']),O({'not':R('condition')},['not']),O({'target':E('level','class.level','equipped','attuned','unarmored','shield','ability','choice','proficient'),'op':E('eq','gte','lte','includes'),'value':scalar},['target','op','value'])]},
 'modifier':O({'target':target,'op':E('add','set','min','max','upgrade'),'value':scalar,'formula':F,'condition':R('condition'),'stackGroup':S(maxLength=160),'priority':N(-1000,1000)},['target','op']),
 'recovery':O({'period':E('short','long','dawn','manual'),'amount':{'oneOf':[{'const':'all'},N(),{**F,'not':{'const':'all'}}]}},['period','amount']),
 'filter':O({'kind':S(),'class':S(),'classSource':S(),'level':N(0,9),'school':S(),'source':{'oneOf':[S(),A(S(),1,100)]}}),
 'grant':O({'type':E('skillProficiency','toolProficiency','languageProficiency','armorProficiency','weaponProficiency','savingThrow','expertise','feat','spell','feature','item','abilityScore'),'key':S(maxLength=160),'fixed':A(S(),1,1000),'choose':O({'count':N(1,100),'from':A(S(),1,1000),'filter':R('filter'),'weights':A(N(-10,20),1,100)},['count']),'usage':E('free','slotOrUses','uses','ritual','expanded'),'uses':O({'max':R('amount'),'recovery':A(R('recovery'),1,4)},['max','recovery']),'ability':{'oneOf':[ability,O({'choose':A(ability,1,6)},['choose'])]},'atLevel':N(0,20),'spellLevel':N(0,9),'resource':S(maxLength=160),'ambiguous':B,'origin':S(maxLength=160)},['type']),
 'resource':O({'key':S(maxLength=160),'max':R('amount'),'recovery':A(R('recovery'),0,4),'scaling':A(O({'level':N(1,20),'max':R('amount')},['level','max']),0,20),'formula':F},['key','max','recovery']),
 'action':O({'type':E('attack','save','check','damage','heal','utility','cast','summon','enchant','teleport','transform'),'key':S(maxLength=160),'activation':E('action','bonus','reaction','special','none','minute','hour','day','rest'),'target':E('self','creature','object','area','other'),'formula':F,'spell':S(maxLength=6000),'save':O({'ability':ability,'dc':{'oneOf':[N(0,100),F]}},['ability','dc']),'consumes':O({'resource':S(maxLength=160),'amount':{'oneOf':[N(0,10000),F]}},['resource','amount']),'deferred':{'const':True}},['type','activation','target']),
 'effect':O({'name':S(maxLength=160),'duration':O({'unit':E('instant','round','minute','hour','day','permanent','special'),'value':N(0,10000)},['unit']),'changes':A(R('modifier'),0,100),'statuses':A(S(maxLength=100),0,100),'deferred':{'const':True}},['name','duration','changes','statuses','deferred']),
 'classModel':O({'hitDie':E(4,6,8,10,12),'casterProgression':E('full','half','third','artificer','pact','none'),'spellcastingAbility':ability,'cantripProgression':A(N(0,100),0,20),'preparedProgression':A(N(0,100),0,20),'preparedFormula':F,'preparedChange':E('level','restLong','manual'),'knownProgression':A(N(0,100),0,20),'bookProgression':A(N(0,100),0,20),'spellSlots':A(A(N(0,100),0,9),0,20),'spellChoices':A(O({'count':N(1,100),'from':A(S(),1,10000),'atLevel':N(0,20)},['count']),0,100),'cantripChange':E('level','restLong','manual'),'classFeatures':A(S(maxLength=6000),0,1000),'subclassFeatures':A(S(maxLength=6000),0,1000)}),
 'equipmentModel':O({'category':E('lightArmor','mediumArmor','heavyArmor','shield','weapon','other'),'ac':N(0,100),'dexCap':N(-20,20),'strength':N(0,30),'stealthDisadvantage':B,'requiresAttunement':B,'weaponCategory':E('simple','martial'),'damage':F,'versatileDamage':F,'damageType':S(maxLength=100),'properties':A(S(maxLength=100),0,30),'baseItem':S(maxLength=6000),'attackBonus':N(-100,100),'damageBonus':N(-100,100),'spellAttackBonus':N(-100,100),'spellDcBonus':N(-100,100),'weight':{'type':'number','minimum':0,'maximum':1000000},'value':N(0,1000000000)}),
 'spellModel':O({'level':N(0,9),'school':S(maxLength=100),'ritual':B,'concentration':B,'classes':A(O({'engName':S(),'source':S()},['engName','source']),0,100)},['level']),
 'scale':O({'key':S(maxLength=160),'values':A(O({'level':N(1,20),'value':{'type':'number','minimum':-10000,'maximum':10000}},['level','value']),1,20)},['key','values']),
 'provenance':O({'layer':E('structured','foundry','overlay','rulePack','inventory'),'ref':S(maxLength=6000),'migrationVersion':N(0,100),'reviewer':S(maxLength=100),'reviewedAt':S(maxLength=10,pattern=r'^\d{4}-\d{2}-\d{2}$')},['layer','ref']),
 'evidence':O({'page':N(1,99999),'quote':S(maxLength=300)},['page']),
 'unsupported':O({'code':S(maxLength=100,pattern=r'^[a-zA-Z0-9_.-]+$'),'family':S(maxLength=100,pattern=r'^[a-zA-Z0-9_.-]+$'),'ref':S(maxLength=6000),'deferred':B},['code','family']),
 'input':O({'url':S(pattern=r'^https://[^\s]+$'),'path':S(),'namespace':S(),'role':E('catalog','foundry','index','version'),'sha256':S(minLength=64,maxLength=64,pattern=r'^[a-f0-9]{64}$'),'bytes':N(1,33554432)},['url','path','namespace','role','sha256','bytes']),
}

# G3 structured-field representations: explicit ownership, choices and one-time equipment.
defs['grant']['properties']['referenceAliases']={'type':'object','maxProperties':1000,'propertyNames':S(maxLength=6000),'additionalProperties':S(maxLength=3000,pattern=r'^[\x20-\x7e]+$')}
defs['grant']['properties'].update({'scope':E('all','firstClass','multiclass'),'setKey':S(maxLength=160),'setOption':N(0,100),'amount':N(-10,20),'abilityChoiceKey':S(maxLength=160),'atSpellLevel':N(0,9),'canUseSlots':B,'usagePool':S(maxLength=160),'choiceProgression':A(O({'level':N(0,20),'count':N(0,100)},['level','count']),1,21)})
defs['filter']['properties'].update({'featureType':A(S(),1,100)})
defs['equipmentPart']=O({'identity':S(maxLength=6000),'category':E('weaponSimple','weaponMartial','focusSpellcastingHoly','focusSpellcastingArcane','focusSpellcastingDruidic'),'quantity':N(1,3000),'copper':N(0,100000000),'unresolved':{'const':True}},[])
defs['equipmentOption']=O({'key':S(maxLength=100),'items':A(R('equipmentPart'),0,1000)},['key','items'])
defs['startingEquipment']=O({'blocks':A(O({'key':S(maxLength=100),'options':A(R('equipmentOption'),1,100)},['key','options']),0,100),'scope':E('all','firstClass')},['blocks','scope'])
defs['classModel']['properties']['referenceAliases']=defs['grant']['properties']['referenceAliases']
defs['classModel']['properties']['ritualAccess']=E('book','prepared','known')
defs['equipmentModel']['properties'].update({'weaponType':E('melee','ranged'),'spellFocus':E('holy','arcane','druid'),'firearm':B})

# Foundry dice scales remain typed dice; they are never converted to a numeric bonus.
defs['scale']['properties']['values']=A({'oneOf':[O({'level':N(0,20),'value':{'type':'number','minimum':-10000,'maximum':10000}},['level','value']),O({'level':N(0,20),'dice':O({'count':N(1,100),'faces':N(2,1000)},['count','faces'])},['level','dice'])]},1,21)
defs['modifier']['oneOf']=[{'required':['value'],'not':{'required':['formula']}},{'required':['formula'],'not':{'required':['value']}}]
defs['grant']['oneOf']=[{'required':['fixed'],'not':{'required':['choose']}},{'required':['choose'],'not':{'required':['fixed']}}]
defs['grant']['properties']['choose']['oneOf']=[{'required':['from'],'not':{'required':['filter']}},{'required':['filter'],'not':{'required':['from']}}]
defs['action']['allOf']=[{'if':{'properties':{'type':{'const':'cast'}},'required':['type']},'then':{'required':['spell']}}]
defs['mechanics']=O({k:A(R(k),0,1000) for k in ['modifier','grant','resource','action','effect']})
defs['mechanics']['properties']={k+'s':v for k,v in defs['mechanics']['properties'].items()}
for k in ['classModel','equipmentModel','spellModel','startingEquipment']:defs['mechanics']['properties'][k]=R(k)
defs['mechanics']['properties']['scales']=A(R('scale'),0,100)
recordProps={'identity':R('identity'),'tags':O({'featCategory':S(maxLength=100),'featureTypes':A(S(maxLength=100),1,100)}),'edition':E('2014','2024','both'),'entryIds':A(S(maxLength=6000),0,1000),'foundryFlags':A(E('ignoreSrdEffects','ignoreSrdActivities','isIgnored'),0,3),'verdict':E('automated','noMechanics','needsAnnotation','unsupported'),'provenance':A(R('provenance'),1,100),'evidence':R('evidence'),'mechanics':R('mechanics'),'unsupported':A(R('unsupported'),0,1000),'reasonCode':E('narrative','placeholder','choiceOfOtherEntry','coveredByParent','tableOnly','asiPlaceholder'),'autoGenerated':{'const':True},'notes':{'type':'string','maxLength':2000}}
defs['record']=O(recordProps,['identity','verdict','provenance','unsupported'])
defs['record']['allOf']=[{'if':{'properties':{'verdict':{'const':'noMechanics'}},'required':['verdict']},'then':{'required':['reasonCode']}},{'if':{'properties':{'verdict':{'const':'needsAnnotation'}},'required':['verdict']},'then':{'required':['autoGenerated']}},{'if':{'properties':{'verdict':{'const':'automated'}},'required':['verdict']},'then':{'required':['mechanics'],'properties':{'unsupported':{'type':'array','maxItems':0}}}},{'if':{'properties':{'verdict':{'const':'unsupported'}},'required':['verdict']},'then':{'properties':{'unsupported':{'type':'array','minItems':1}}}}]
versionLock=O({'kiweeChangelogVersion':S(),'kiweeChangelogDate':S(maxLength=10,pattern=r'^\d{4}-\d{2}-\d{2}$'),'fetchedAt':S(maxLength=40,pattern=r'^\d{4}-\d{2}-\d{2}T'),'foundryMigrationVersion':A(N(0,100),1,100),'toolVersion':S(),'inputs':A(R('input'),1,10000)},['kiweeChangelogVersion','kiweeChangelogDate','fetchedAt','foundryMigrationVersion','toolVersion','inputs'])
defs['versionLock']=versionLock
schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://fullpeople.github.io/dnd5e-automation-data/schema/automation-ir.schema.json',**O({'schemaVersion':{'const':1},'protocol':{'const':3},'versionLock':R('versionLock'),'records':A(R('record'),0,100000)},['schemaVersion','protocol','versionLock','records']),'$defs':defs}
overlayProps={k:v for k,v in recordProps.items() if k!='provenance'}
overlayProps.update({'reviewer':S(maxLength=100),'reviewedAt':S(maxLength=10,pattern=r'^\d{4}-\d{2}-\d{2}$'),'batch':S(maxLength=100),'overrides':A(E('structured','foundry'),1,2),'overrideReason':S(maxLength=300)})
overlayRecord=O(overlayProps,['identity','verdict','unsupported','reviewer','reviewedAt','batch','evidence'])
overlayRecord['allOf']=defs['record']['allOf']+[{'not':{'properties':{'verdict':{'const':'needsAnnotation'}},'required':['verdict']}},{'if':{'required':['overrides']},'then':{'required':['overrideReason']}}]
overlayDefs={**defs,'overlay':overlayRecord}
overlay={'$schema':schema['$schema'],'$id':schema['$id'].replace('automation-ir','overlay'),'type':'array','items':R('overlay'),'maxItems':100000,'$defs':overlayDefs}
for name,data in [('automation-ir',schema),('overlay',overlay)]:Path('schema',name+'.schema.json').write_text(json.dumps(data,indent=2)+'\n')

Path('src/validate/schemas.ts').write_text('// Generated by scripts/build_schema.py; do not hand-edit.\nexport const automationSchema = '+json.dumps(schema,separators=(',',':'))+';\nexport const overlaySchema = '+json.dumps(overlay,separators=(',',':'))+';\n')
