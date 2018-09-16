//Dependencias
const rp = require('request-promise')
var request = require('request')
const express = require('express')
const app = express()
const mysql = require('mysql')
var uuid = require('node-uuid')
var httpContext = require('express-http-context')

//sessionId
app.use(httpContext.middleware);
// Asigna unique identifier a cada request
app.use(function(req, res, next) {
  httpContext.set('reqId', uuid.v1());
  next();
});

app.get("/:category&:publisher_campaign&:zip_code&:maximum", (req, res) => {
  console.log("Fetching query: " + req.originalUrl)
  var reqId = httpContext.get('reqId');
  const cat = req.params.category.split("=").pop();
  const publiCamp = req.params.publisher_campaign.split("=").pop();
  const zipCode = req.params.zip_code.split("=").pop();
  var ids = [];
  var bids = [];
  var exclusion = "";
  var targeting = "";
  var ranking = "";
  var ads = "";
  var pricing = "";
  var arrayIds = [];
  var arrayBids = [];
  if (req.params.maximum != undefined){
    var max = req.params.maximum.split("=").pop();
  }else{
    var max = 0;
  }
  var options={
    methode: 'GET',
    uri:'http://ec2-18-212-140-2.compute-1.amazonaws.com:80/Matching.php?category=' + cat,
    json:true
  };
  rp(options)
    .then(function(parseBody){
      matchingRes = parseBody;
    })
    .catch(function (err){
    }).finally(function(){
      for(i=0; i<matchingRes.length; i++){
        let bid = [];
        let id = [];
        id.push(matchingRes[i]["id"]);
        bid.push(matchingRes[i]["bid"]);
        ids.push(id);
        bids.push(bid);
      }
      let arrayIds = [ids];
      let arrayBids = [bids];
      console.log("Matching " + ids)
      ids = ids.toString().replace("[","");
      bids = bids.toString().replace("[","");
      callExclusion(ids, publiCamp, function(returnValue) {
        exclusionRes = returnValue;
        exclusion = returnValue.toString().replace("[","");
        exclusion = exclusion.toString().replace("]","");
        exclusion = [exclusion];
        callTargeting(ids,zipCode, function(returnValue) {
          targetingRes = returnValue;
          targeting = returnValue.toString().replace("[","");
          targeting = targeting.toString().replace("]","");
          targeting = [targeting];
          var array1 = JSON.parse("[" + exclusion + "]");
          var array2 = JSON.parse("[" + targeting + "]");
          var newIds = array1.filter(x => array2.includes(x));
          arrayIds = JSON.parse("[" + arrayIds + "]");
          arrayBids = JSON.parse("[" + arrayBids + "]");
          var newBids = [];
          for (let value in newIds){
            var idPosition = arrayIds.indexOf(newIds[value]);
            var bidValue = arrayBids[idPosition];
            newBids.push(bidValue);
          }
          callRanking(newIds, newBids, max, function(returnValue) {
            ranking = returnValue.toString().replace("[","");
            ranking = ranking.toString().replace("]","");
            callAds(ranking, function(returnValue) {
              ads = returnValue
              ads = JSON.parse(ads);
              ads.unshift({"QueryId": reqId});
              console.log(ads);
              res.json(ads);
              callPricing(ids,bids,publiCamp, function(returnValue) {
                pricing = returnValue.toString();
              });
            });
          });
        });
      });
    });
})

app.get("/:category&:publisher_campaign&:zip_code", (req, res) => {
  console.log("Fetching query: " + req.originalUrl)
  var reqId = httpContext.get('reqId');
  const cat = req.params.category.split("=").pop();
  const publiCamp = req.params.publisher_campaign.split("=").pop();
  const zipCode = req.params.zip_code.split("=").pop();
  var ids = [];
  var bids = [];
  var exclusion = "";
  var targeting = "";
  var ranking = "";
  var ads = "";
  var pricing = "";
  var max = 0;
  var options={
    methode: 'GET',
    uri:'http://ec2-18-212-140-2.compute-1.amazonaws.com:80/Matching.php?category=' + cat,
    json:true
  };
  rp(options)
    .then(function(parseBody){
      matchingRes = parseBody;
    })
    .catch(function (err){
    }).finally(function(){
      for(i=0; i<matchingRes.length; i++){
        let bid = [];
        let id = [];
        id.push(matchingRes[i]["id"]);
        bid.push(matchingRes[i]["bid"]);
        ids.push(id);
        bids.push(bid);
      }
      let arrayIds = [ids];
      let arrayBids = [bids];
      console.log("Matching " + ids)
      ids = ids.toString().replace("[","");
      bids = bids.toString().replace("[","");
      callExclusion(ids, publiCamp, function(returnValue) {
        exclusionRes = returnValue;
        exclusion = returnValue.toString().replace("[","");
        exclusion = exclusion.toString().replace("]","");
        exclusion = [exclusion];
        callTargeting(ids,zipCode, function(returnValue) {
          targetingRes = returnValue;
          targeting = returnValue.toString().replace("[","");
          targeting = targeting.toString().replace("]","");
          targeting = [targeting];
          var array1 = JSON.parse("[" + exclusion + "]");
          var array2 = JSON.parse("[" + targeting + "]");
          var newIds = array1.filter(x => array2.includes(x));
          arrayIds = JSON.parse("[" + arrayIds + "]");
          arrayBids = JSON.parse("[" + arrayBids + "]");
          var newBids = [];
          for (let value in newIds){
            var idPosition = arrayIds.indexOf(newIds[value]);
            var bidValue = arrayBids[idPosition];
            newBids.push(bidValue);
          }
          callRanking(newIds, newBids, max, function(returnValue) {
            ranking = returnValue.toString().replace("[","");
            ranking = ranking.toString().replace("]","");
            callAds(ranking, function(returnValue) {
              ads = returnValue
              ads = JSON.parse(ads);
              ads.unshift({"QueryId": reqId});
              console.log(ads);
              res.json(ads);
              callPricing(ids,bids,publiCamp, function(returnValue) {
                pricing = returnValue.toString();
              });
            });
          });
        });
      });
    });
})




function callExclusion(idsToSend, publiToSend, callback) {
  console.log('exclusion http://ec2-18-206-193-107.compute-1.amazonaws.com:8082/exclusion.php?advertiser_campaigns=' + idsToSend + '&publisher_campaign=' + publiToSend)
  rp('http://ec2-18-212-140-2.compute-1.amazonaws.com:8082/exclusion.php?advertiser_campaigns=' + idsToSend + '&publisher_campaign=' + publiToSend)
  .then(function (parseBody) {
      respo = parseBody;
  })
  .catch(function (err) {
      // Crawling failed...
      console.log("Exclusion did not finish correctly");
  }).finally(function(){
    console.log("Exclusion: " + respo);
    callback(respo);
  });
}

function callTargeting(idsToSend, zipsToSend, callback) {
  console.log('url = http://ec2-18-212-140-2.compute-1.amazonaws.com:8084/targeting.php?advertiser_campaigns=' + idsToSend + '&zip_code=' + zipsToSend)
  rp('http://ec2-18-212-140-2.compute-1.amazonaws.com:8084/targeting.php?advertiser_campaigns=' + idsToSend + '&zip_code=' + zipsToSend)
  .then(function (parseBody) {
      respo = parseBody;
  })
  .catch(function (err) {
      // Crawling failed...
      console.log("Targeting did not finish correctly");
  }).finally(function(){
    console.log("Targeting: " + respo);
    callback(respo);
  });
}

function callRanking(idsToSend, bidsToSend, max, callback) {
    if (max == 0){
      rp('http://ec2-18-212-140-2.compute-1.amazonaws.com:8083/Ranking.php?advertiser_campaigns=' + idsToSend + '&advertiser_campaign_bid=' + bidsToSend)
      .then(function (parseBody) {
          respo = parseBody;
      })
      .catch(function (err) {
          // Crawling failed...
          console.log("Ranking did not finish correctly " + err);
      }).finally(function(){
        console.log("Ranking: " + respo);
        callback(respo);
      });
    }else{
      rp('http://ec2-18-212-140-2.compute-1.amazonaws.com:8083/Ranking.php?advertiser_campaigns=' + idsToSend + '&advertiser_campaign_bid=' + bidsToSend + '&maximum=' + max)
      .then(function (parseBody) {
          respo = parseBody;
      })
      .catch(function (err) {
          // Crawling failed...
          console.log("Ranking did not finish correctly" + err);
      }).finally(function(){
        console.log("Ranking: " + respo);
        callback(respo);
      });
    }  
}

function callAds(idsToSend, callback) {
  rp('http://ec2-18-212-140-2.compute-1.amazonaws.com:8080/ads.php?advertiser_campaigns=' + idsToSend)
  .then(function (parseBody) {
      respo = parseBody;
  })
  .catch(function (err) {
      // Crawling failed...
      console.log("Ads did not finish correctly");
  }).finally(function(){
    console.log("Ads: " + respo);
    callback(respo);
  });
}

function callPricing(idsToSend, bidsToSend, publiToSend, callback) {
  rp('http://ec2-18-212-140-2.compute-1.amazonaws.com:8081/pricing.php?advertiser_campaigns=' + idsToSend + '&advertiser_campaigns_bid=' + bidsToSend + '&publisher_campaign=' + publiToSend)
  .then(function (parseBody) {
      respo = parseBody;
  })
  .catch(function (err) {
      // Crawling failed...
      console.log("Pricing did not finish correctly");
  }).finally(function(){
    console.log("Pricing: " + respo);
    callback(respo);
  });
}

// localhost:80
app.listen(80, () => {
  console.log("Server is up and listening on 80...")
})
