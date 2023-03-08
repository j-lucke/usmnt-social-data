
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const client = new TwitterApi(process.env.TWITTER_KEY);

const usmnt = require('knex') ({
  client: 'pg',
  connection: process.env.DB_CONFIG
});

function createColumnName() {
  const now = new Date();
  return (
    now.getFullYear() + '-' + 
    now.getMonth() + '-' +
    now.getDate() + '-' +
    now.getHours() + '-' + 
    now.getMinutes()
  );
}

let COLUMN_NAME = createColumnName();

async function createNewColumn() {
  await usmnt.schema.table('twitter_followers', (table) => {
    table.integer(COLUMN_NAME);
  });
}

async function updateRecord(twitterUser){
  try {
    const p = usmnt('twitter_followers')
      .where({twitter_name: twitterUser.data.username})
      .update({current_count: twitterUser.data.public_metrics.followers_count})
      .then();
    await p;
  } catch(e) {
    console.log('caught an error:');
    console.log(e);
  }

  try {
    const q = usmnt('twitter_followers')
      .where({twitter_name: twitterUser.data.username})
      .update(COLUMN_NAME, twitterUser.data.public_metrics.followers_count)
      .then();
    await q;
  } catch (e) {
    console.log(twitterUser);
  }
}

async function main(){
  await createNewColumn();
  usmnt.select('*')
  .from('players')
  .then( (data) => {
    let names = [];
    data.forEach( x => {
      if (x.twitter_name != null) 
        names.push('users/by/username/' + x.twitter_name + '?user.fields=public_metrics' )
      else {
        names.push( null ); 
      }
    });
    return names
  })
  .then( x => {
    let p = [];
    x.forEach( s => { 
      if (s != null) 
        p.push( client.v2.get(s).then(updateRecord) ) 
    });
    return Promise.all(p);
  })
  .then( () => usmnt.destroy() );
}

main();
