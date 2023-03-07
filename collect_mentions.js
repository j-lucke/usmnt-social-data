const dotenv = require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const client = new TwitterApi(process.env.TWITTER_KEY);

const knex = require('knex')({
  client: 'pg',
  connection: process.env.DB_CONFIG 
});

function kill(){
  knex.destroy();
}

function columnName() {
  const now = new Date()
  name = now.toISOString().split('T')[0]  
  return name;
}

async function createColumn(){
  const name = columnName()
  columnExists = await knex.schema.hasColumn('mentions', name)
  if (!columnExists) {
    await knex.schema.table('mentions', (data) => {
      data.integer(name)
      console.log(`created column ${name}`)
    })
  } else {
    console.log(`column ${name} already exists.`)
  }
}

function startOfToday(){
  const now = new Date()
  now.setUTCHours(0)
  now.setUTCMinutes(0)
  now.setUTCSeconds(0)
  now.setUTCMilliseconds(0)
  return now.toISOString()
}

async function main2() {
  console.log('creating column...')
  await createColumn()
  console.log('asking postgres for players...')
  knex.select('*')
    .from('mentions')
    //.where('id', '<', 10)
    .then( playerList => {
      const promises = []
      playerList.forEach( player => {
        console.log(`starting update for ${player.twitter_name}...`)
        p = client.v2.tweetCountRecent(`@${player.twitter_name}`, {granularity: 'day', start_time: startOfToday()})
              .then(twitterData => {
                //console.log(twitterData)
                const notOnTwitter = (!player.twitter_name)
                if (notOnTwitter) {
                  return knex('mentions')
                  .where({id: player.id})
                  .update(columnName(), 0)
                  .then( () => console.log(`...${player.twitter_name} done ${player.id} NULL.`))
                } else {
                  return knex('mentions')
                  .where({id: player.id})
                  .update(columnName(), twitterData.meta.total_tweet_count)
                  .then( () => console.log(`...${player.twitter_name} done.`))
                }
              })
        promises.push(p)
      })
      return Promise.all(promises)
    })
    .then(kill)   
}

main2()


