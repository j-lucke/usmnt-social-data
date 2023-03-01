const dotenv = require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const client = new TwitterApi(process.env.TWITTER_KEY);

const knex = require('knex')({
  client: 'pg',
  connection: process.env.DB_CONFIG 
});

//idNum = process.argv[2]

async function updateRecord(player) {
  return client.v2.tweetCountRecent(`@${player.twitter_name}`, {granularity: 'day'})
    .then( (twitterData) => {
      //console.log(`${player.id} ${player.twitter_name}`)
      return twitterData
    })
    .then(twitterData => {
      return knex('mentions_this_week')
        .where({id: player.id})
        .update({twitter_report: twitterData})
        .then()
    })
}

async function display(){
  knex.select('*').from('mentions_this_week').where('id', '=', idNum)
    .then( records => {
      records.forEach( row => {
        r = JSON.parse(row.twitter_report)
        console.log(r.data.map(x => x.tweet_count))
      })
    })
}

async function main() {
  //await display()

  const promises = []
  console.log('asking postgres...')
  await knex.select('*')
    .from('players')
    //.where('id', '=', idNum)
    .then( playerList => {
      //console.log('got data, now going forEach...') 
      return playerList
    })
    .then( playerList => {
      playerList.forEach( player => {
        const p = updateRecord(player)
        promises.push(p)
      }) 
    })

  await Promise.all(promises)
  //await display()
  knex.destroy()
}

main()

