require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const client = new TwitterApi(process.env.TWITTER_KEY);

const usmnt = require('knex') ({
  client: 'pg',
  connection: process.env.DB_CONFIG
});

getData = async function() {
  console.log('fetching data. . .')
  let data = await usmnt.select('*').from('twitter_followers').orderBy('id').then()
  console.log('processing . . . ')
  return data
}

newTable = async function(){
  usmnt.schema.createTable('twitter_followers_remix', function (table) {
    table.integer('id')
    table.string('first_name')
    table.string('last_name')
    table.string('twitter_name')
    table.integer('current_count')
  }).then()
}

getBasics = async function(){
  let basics = await usmnt.select('id', 'first_name', 'last_name', 'twitter_name', 'current_count')
    .from('twitter_followers')
    .then()
  return basics
}

main = async function() {

    let newRecords = []
    let data = await getData()
    
    data.forEach(player => {
      let selection = {}
      for (property in player) {
        const bits = property.split('-')
        const date = bits.slice(0, 3).join('-')
        if (player[property])
          selection[date] = player[property]
      }
      newRecords.push(selection)
    })
    
   // console.log(newRecords[0])
    
   usmnt.insert(newRecords).into('twitter_followers_remix').then( () => {usmnt.destroy()})

    /*
    for (field in newRecords[0]) {
      let alreadyExists = await usmnt.schema.hasColumn('twitter_followers_remix', field)
      if (!alreadyExists) {
        await usmnt.schema.table('twitter_followers_remix', table => {
          table.integer(field)
        }).then( () => {console.log(`added: ${field}`)})
      }
    }
    */
    

   
}

main()