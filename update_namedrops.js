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

function yesterday(){
  let now = new Date()
  now.setUTCDate(now.getUTCDate() - 1)
  return now.toISOString()
}

async function main2() {
  console.log('asking postgres for players...')
  knex.select('*')
    .from('name_drops')
    //.where('id', '<', 5)
    .then( playerList => {
      const promises = []
      playerList.forEach( player => {
        console.log(`starting update for ${player.first_name} ${player.last_name}...`)
        p = client.v2.tweetCountRecent(`"${player.first_name} ${player.last_name}"`, {granularity: 'hour', start_time: yesterday()})
              .then(twitterData => {
                return knex('name_drops')
                  .where({id: player.id})
                  .update('report', JSON.stringify(twitterData))
                  .then( () => console.log(`... ${player.first_name} ${player.last_name} done.`))
              })
        promises.push(p)
      })
      return Promise.all(promises)
    })
    .then(kill)   
}

main2()


