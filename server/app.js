const express = require('express');
var cors = require('cors');

const app = express();
app.use(cors());

const debug = require('debug')('myapp:server');
const PORT = process.env.PORT || 8080;

const request = require('request');

function make_request(url)
{
	return new Promise((resolve, reject) => {
        request(url, {json:true}, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

function createfilter(count, filterName, filterValue, param) {
	if(param)
		return "&itemFilter(" + count + ").paramName=" + filterName + "&itemFilter(" + count + ").paramValue=" + filterValue;
	else 
	    return "&itemFilter(" + count + ").name=" + filterName + "&itemFilter(" + count + ").value=" + filterValue;
}

app.get('/', async function (req, res, next)
	{
        var keywords = req.query.keywords;      //keywords
        var min_price = req.query.min_price;    //min_price
        var max_price = req.query.max_price;    //max_price
        var condition1 = req.query.new;         //condition1
        var condition2 = req.query.used;        //condition2
        var condition3 = req.query.very_good;   //condition3
        var condition4 = req.query.good;        //condition4
        var condition5 = req.query.acceptable;  //condition5
        var return_ = req.query.return;         //return
        var free = req.query.free;              //free
        var expedited = req.query.expedited;    //expedited
        var sortorder = req.query.SortOrder;    //sortOrder

        var url = "https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=NaureenF-CS571Web-PRD-92eba3d7e-ea9abf29&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD";
        url += "&keywords=" + keywords;   
        url += "&sortOrder=" + sortorder;
        var count=0;
        if(min_price != undefined && min_price != "null" ) {
          url += createfilter(count, "MinPrice", min_price, false);
          url += createfilter(count, "Currency", "USD", true);
          count++;
        }
        if(max_price != undefined && max_price != "null" ) {
          url += createfilter(count, "MaxPrice", max_price, false);
          url += createfilter(count, "Currency", "USD", true);
          count++;
        }
        if(return_ != undefined && return_ != "null" ) {
          url += createfilter(count, "ReturnsAcceptedOnly", return_, false);
          count++;
        }
        if(free != undefined && free != "null" ) {
          url += createfilter(count, "FreeShippingOnly", free, false);
          count++;
        }
        if(expedited != undefined && expedited != "null") {
          url += createfilter(count, "ExpeditedShippingType","Expedited", false);
          count++;
        }
        const cond = [ 0 , 1000, 3000, 4000, 5000, 6000];
        if(condition1 != "null" || 
           condition2 != "null" || 
           condition3 != "null" || 
           condition4 != "null" || 
           condition5 != "null"  ) {
          url += "&itemFilter(" + count + ").name=" + "Condition";
          var value_count= 0;
          var cond_values = [ false, condition1, condition2, condition3, condition4, condition5];
          var i;
          for(i=1;i<cond_values.length;i++) {
            if(cond_values[i] != "null" && cond_values[i] != undefined) {
              url += "&itemFilter(" + count + ").value(" + value_count + ")=" + cond[i];
              value_count++;
            }
          }
        } 
        console.log(url);
        body = await make_request(url);
        var findItemsAdvanced = body['findItemsAdvancedResponse'][0];

        if (findItemsAdvanced['ack'][0] == 'Success'){
          console.log("Successful response")
          var paginationOutput = findItemsAdvanced['paginationOutput'][0]
          var totalEntries = paginationOutput['totalEntries'][0]
          filtered_items = Array();
          if(totalEntries > 0){
            for(j=0;j<=totalEntries;j++){ 
              item = findItemsAdvanced['searchResult'][0]['item'][j];
              try {
                if(item != undefined) {
                  title      =  item['title'][0];
                  if( item['galleryURL'][0] == undefined ||  item['galleryURL'][0] == null) {
                    galleryURL =  'https://csci571.com/hw/hw8/images/ebayDefault.png';
                  }
                  galleryURL =  item['galleryURL'][0];
                  viewitemURL = item['viewItemURL'][0];
                  sellingStatus =  item['sellingStatus'];
                  location   =  item['location'][0];  
                  currentPrice = item['sellingStatus'][0]['currentPrice'][0]['__value__'];
                  categoryName = item['primaryCategory'][0]['categoryName'][0];
                  condition = item['condition'];
                  conditionDisplayName = condition[0]['conditionDisplayName'][0];
                  shippingInfo = item['shippingInfo'];
                  shippingType = item['shippingInfo'][0]['shippingType'][0];
                  shippingCost = item['shippingInfo'][0]['shippingServiceCost'][0]['__value__'];
                  shipToLocation = item['shippingInfo'][0]['shipToLocations'][0];
                  ExpeditedShipping = item['shippingInfo'][0]['expeditedShipping'][0];
                  OneDayShippingAvailable = item['shippingInfo'][0]['oneDayShippingAvailable'][0];
                  listingInfo = item['listingInfo'];
                  BestOfferEnabled = item['listingInfo'][0]['bestOfferEnabled'][0];
                  BuyItNowAvailable = item['listingInfo'][0]['buyItNowAvailable'][0];
                  ListingType = item['listingInfo'][0]['listingType'][0];
                  Gift = item['listingInfo'][0]['gift'][0];
                  WatchCount = item['listingInfo'][0]['watchCount'][0];
                  if(title && galleryURL && currentPrice && location && categoryName && conditionDisplayName && shippingType && shippingCost
                     && shipToLocation && ExpeditedShipping && OneDayShippingAvailable && BestOfferEnabled && BuyItNowAvailable && ListingType
                     && Gift && WatchCount && viewitemURL){
                      console.log(filtered_items.length);
                      var len = filtered_items.push({'title' : title, 'galleryURL' : galleryURL, 'viewitemURL':  viewitemURL, 'currentPrice' : currentPrice, 'location' : location, 'categoryName' : categoryName, 'conditionDisplayName' : conditionDisplayName, 'shippingType' : shippingType, 'shippingCost': shippingCost, 'shipToLocation':shipToLocation, 'ExpeditedShipping': ExpeditedShipping, 'OneDayShippingAvailable': OneDayShippingAvailable, 'BestOfferEnabled': BestOfferEnabled, 'BuyItNowAvailable':BuyItNowAvailable, 'ListingType': ListingType, 'Gift':Gift, 'WatchCount':WatchCount});
                      if(len >= 200) break;
                  }
                }
              }   
              catch(error) {
                continue;
              }
          }   
          res.status(200).json({'status' : 'ok', 'items' : filtered_items, 'totalEntries' : totalEntries, 'message': "Successful : Entries Found"})
        }
        else {
          res.status(200).json({'status' : 'ok', 'items' : filtered_items, 'totalEntries' : totalEntries, 'message': "No Results Found"})
        }
      }
        else {
          console.log('Error Occurred')
      }
})

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
//404 Responses
app.use(function (req, res, next) {
  res.status(404).json({"message" : "Sorry can't find that resource!"})
})

//Error Handling
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).json({"message" : 'Some Error at the Server Side!'})
})

module.exports = app;