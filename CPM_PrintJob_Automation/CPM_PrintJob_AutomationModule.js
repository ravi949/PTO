define(['N/search', 'N/record', 'N/runtime'],

function(search, record, runtime) {
  
	/**
	 * 
	 * @param {String} printJobId
	 * @returns
	 */
	function setAutomationComplete(printJobId) {
		var printJob = record.load({
			type: record.Type.OPPORTUNITY,
			id: printJobId
		});
		printJob.setValue({
			fieldId:'custbody_cpm_automationstatus', 
			value:'2'
		});
		
		printJob.save({enableSourcing:true,ignoreMandatoryFields:true});  //main code:- latest
		log.audit('Completed', 'PrintJob marked Complete');
	}
	/**
	 * @param {Object} objArray
	 * @returns {Boolean}
	 */
	function setLineValues(recId, objArray, eachId, perJobId, perThousandId,mfgBrcItemId) {
		var printJob = record.load({
			type: record.Type.OPPORTUNITY,
			id: recId,
			isDynamic: true
		});

		log.debug('objArray',objArray)
		
		objArray.forEach(function(lineValue){
			try{
				printJob.selectLine({
					sublistId: 'item', line: lineValue.lineNo
				});
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'quantity',
					value: lineValue.quantity
				});
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'costestimatetype',
					value: 'CUSTOM'
				});
				
				var estCost = 0;
				if (lineValue.itemPurchaseUnit == perThousandId){  //equal to per 1000
					estCost = lineValue.quantity * ((parseFloat(lineValue.cost))/1000);
					////log.debug('R/M COST cost', lineValue.cost);
					////log.debug('R/M COST qty', lineValue.quantity);
					////log.debug('R/M COST estCost', estCost);
				} else {
					estCost = lineValue.quantity * parseFloat(lineValue.cost);
				}
				
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'costestimate',
					value: estCost
				});
				
				if(lineValue.priceLevel != 0){
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'price',
						value: (lineValue.priceLevel)?lineValue.priceLevel:-1
					});
				}
				
				
				if (lineValue.markup != null && lineValue.markup != '0' && lineValue.costfound){
					var rate = 0, amount = 0;
					//amount = estCost * (1 + parseFloat(lineValue.markup)/100);    //need confirmation from giriesh
					
					estCost = (lineValue.item == mfgBrcItemId)?lineValue.cost:estCost; // taj added the new line for brc item condition
					
					if(lineValue.spoilage == 0){
						estCost = lineValue.cost;
					}
					
					//taj added this condition
					if(lineValue.itemUnit == eachId || lineValue.itemUnit == perJobId){   //equal to each
					    rate = estCost * (1 + parseFloat(lineValue.markup)/100); //this giriesh added line 
						//rate = (lineValue.cost) * (1 + parseFloat(lineValue.markup)/100); //changed by taj
					}

					if(lineValue.itemUnit == perThousandId){  //equal to per 1000
						 rate = estCost * (1 + parseFloat(lineValue.markup)/100); //taj added this line
					     amount = (lineValue.quantity * rate)/1000;
					} else {
						//rate = amount / lineValue.quantity;
					}
										
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'rate',
						value: rate
					});
					
					if(amount > 0){
						printJob.setCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							value: round(amount,3)
						});
					}
					
				} else {
					var rate = lineValue.price, amount = 0;
					
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'rate',
						value: rate
					});
					if (lineValue.itemUnit == perThousandId){  //equal to per 1000
						amount = parseFloat(rate) * ((lineValue.quantity)/1000);
					} else {
						amount = parseFloat(rate) * lineValue.quantity;
					}
					
					if(amount > 0){
						printJob.setCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							value: round(amount,3)
						});
					}
				}
				
				log.debug('item values '+lineValue.item,' pricelevel='+lineValue.priceLevel+' quantity='+lineValue.quantity+' costesimate='+estCost+' rate='+rate+' amount='+amount);
				
				printJob.commitLine({
					sublistId: 'item'
				});
			} catch(ex) {
				log.error('Commit Line', ex.name + ' ;; ' + ex.message);
				//log.debug('Commit Line Values', JSON.parse(lineValue));
			}
		});
		
		printJob.save({
			enableSourcing: true,
			ignoreMandatoryFields: true
		});
		return true;
	}
		
	/**
	 * @param {String} estimateId
	 * @param {String} itemId
	 * @param {String} customerId
	 * @param {String} vendorId
	 * @param {String} quantity
	 * @param {Boolean} isVolumePrice
	 * @returns {Object}
	 */
	function getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,priceForVolume,priceForCustomer) {
		
		if (estimateId == null || estimateId == '' || itemId == null || itemId == '') return {price: '0', unit: '-1', markup: '0'};
		
		var priceRecordSearch = {filters:[['isinactive','is',false]]};
		
		priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_item',search.Operator.ANYOF,itemId]);
		
		priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_format',search.Operator.ANYOF,estimateId]);
		
		//taj added the price for volume filter
		priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_forvolume',search.Operator.IS,priceForVolume]);

		priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_forcustomer',search.Operator.IS,priceForCustomer]);
		//end
		
		
		if(customerId != null){
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_customer',search.Operator.ANYOF,customerId]);
		}else{
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_customer',search.Operator.IS,'@NONE@']);
		}
		
		if(vendorId != null){
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_printer',search.Operator.ANYOF,vendorId]);
		}

		log.debug('quantity '+itemId,quantity)
		
		if(isVolumePrice){
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_qtyfloor',search.Operator.LESSTHANOREQUALTO,quantity]);
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_qtycap',search.Operator.GREATERTHANOREQUALTO,quantity]);
		}else{
			priceRecordSearch.filters.push('and',[[['custrecord_cpm_est_price_qtyfloor','isempty',null],'and',
     	     ['custrecord_cpm_est_price_qtycap','isempty',null]],'or',
     	    [['custrecord_cpm_est_price_qtyfloor','equalto',0],'and',
     	     ['custrecord_cpm_est_price_qtycap','equalto',0]]])
		}
		
//		log.debug('cost item '+itemId, priceRecordSearch.filters)
		
		//new line:- if multiple result take the smallest internalid
		var sortedColumn = search.createColumn({
	    	    name: 'internalid',
	    	    sort: search.Sort.ASC
	    });
		
		var priceSearch = search.create({
			type:'customrecord_cpm_estimationprice',
			columns:[sortedColumn,'custrecord_cpm_est_price_itemprice','custrecord_cpm_est_price_unit','custrecord_cpm_est_cost_markup'],
			filters:priceRecordSearch.filters
		});
		
		log.debug('priceRecord'+itemId,priceSearch.run().getRange(0,10));
		
		var priceRecord = null;
		priceSearch.run().each(function(result){
			priceRecord = {};
			if(result.id != null && result.id != ''){
				priceRecord.price = result.getValue({name: 'custrecord_cpm_est_price_itemprice'});
				priceRecord.unit = result.getValue({name: 'custrecord_cpm_est_price_unit'});
				priceRecord.markup = result.getValue({name: 'custrecord_cpm_est_cost_markup'});
				if (priceRecord.markup != null && priceRecord.markup != ''){
					priceRecord.markup = parseFloat(priceRecord.markup);
				} else {
					priceRecord.markup = 0;
				}
			} else {
				priceRecord = null;
			}
			return false;
		});
		return priceRecord;
	}
	
	/**
	 * @param {String} itemId
	 * @param {String} vendorId
	 * @param {String} quantity
	 * @returns {Object}
	 */
	function getBRC(itemId, vendorId, quantity) {
		var costRecordSearch = search.load({
			type : 'customrecord_cpm_estimation_brc',
			id : 'customsearch_cpm_pja_getbrccost'
		});
		costRecordSearch.filters.push(search.createFilter({
			name : 'custrecord_cpm_brc_vendor',
			operator : search.Operator.ANYOF,
			values : vendorId
		}));
		costRecordSearch.filters.push(search.createFilter({
			name : 'custrecord_cpm_brc_item',
			operator : search.Operator.ANYOF,
			values : itemId
		}));
		costRecordSearch.filters.push(search.createFilter({
			name : 'custrecord_cpm_brc_qtyfloor',
			operator: search.Operator.LESSTHANOREQUALTO,
			values : quantity
		}));
		costRecordSearch.filters.push(search.createFilter({
			name : 'custrecord_cpm_brc_qtycap',
			operator: search.Operator.GREATERTHANOREQUALTO,
			values : quantity
		}));
		var costRecord = null;
		costRecordSearch.run().each(function(result){
			costRecord = {};
			if(result.id != null && result.id != ''){
				costRecord.cost = result.getValue({name: 'custrecord_cpm_brc_cost'});
				costRecord.unit = result.getValue({name: 'custrecord_cpm_brc_unit'});
				costRecord.markup = result.getValue({name: 'custitem_cpm_markup', join:'custrecord_cpm_brc_item'});
				costRecord.found = true;
				if (costRecord.markup != null && costRecord.markup != ''){
					costRecord.markup = parseFloat(costRecord.markup);
				} else {
					costRecord.markup = 0;
				}
			} else {
				costRecord = null;
			}
			return false;
		});
		return costRecord;
	}
	
	/**
	 * @param {String} estimateId
	 * @param {String} itemId
	 * @param {String} customerId
	 * @param {String} vendorId
	 * @param {String} quantity
	 * @param {Boolean} isVolumeCost
	 * @returns {Object}
	 */
	function getCostRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumeCost,costForVolume) {
		
		if (estimateId == null || estimateId == '' || itemId == null || itemId == '') return {cost: '0', unit: '-1', spoilage: '0'};
		
		var costRecordSearch = {filters:[['isinactive','is',false]]};
		
		costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_item',search.Operator.ANYOF,itemId]);
		
		costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_format',search.Operator.ANYOF,estimateId]);
		
		//taj added this filter for custrecord_cpm_est_cost_forvolume
		costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_forvolume',search.Operator.IS,costForVolume]);
		
		if(customerId != null){
			costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_customer',search.Operator.ANYOF,customerId]);
		}else{
			costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_customer',search.Operator.IS,'@NONE@']);
		}
		
		if(vendorId != null){
			costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_vendor',search.Operator.ANYOF,vendorId]);
		}
		
//		isVolumeCost && quantity != null && quantity != '' && quantity != 0
		log.debug('quantity '+itemId,quantity)
		
		if(isVolumeCost){
			costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_qtyfloor',search.Operator.LESSTHANOREQUALTO,quantity]);
			costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_qtycap',search.Operator.GREATERTHANOREQUALTO,quantity]);
		}else{
			costRecordSearch.filters.push('and',[[['custrecord_cpm_est_cost_qtyfloor','isempty',null],'and',
    	  	 ['custrecord_cpm_est_cost_qtycap','isempty',null]],'or',[
    	     ['custrecord_cpm_est_cost_qtyfloor','equalto',0],'and',
    	     ['custrecord_cpm_est_cost_qtycap','equalto',0]]
    	    ])
		}
//		log.debug('cost iVolumeCost '+isVolumeCost+' item '+itemId, costRecordSearch.filters)
		//new line:- if multiple result take the smallest internalid
		var sortedColumn = search.createColumn({
	    	    name: 'internalid',
	    	    sort: search.Sort.ASC
	    });
		
		var costSearch = search.create({
			type:'customrecord_cpm_estimationcost',
			columns:[sortedColumn,'custrecord_cpm_est_cost_itemcost','custrecord_cpm_est_cost_unit','custrecord_cpm_est_cost_spoilagefactor'],
			filters:costRecordSearch.filters
		});
		var costRecord = null;
		costSearch.run().each(function(result){
			costRecord = {};
			if(result.id != null && result.id != ''){
				costRecord.cost = result.getValue({name: 'custrecord_cpm_est_cost_itemcost'});
				costRecord.unit = result.getValue({name: 'custrecord_cpm_est_cost_unit'});
				costRecord.spoilage = result.getValue({name: 'custrecord_cpm_est_cost_spoilagefactor'});
				costRecord.found = true;
				if (costRecord.spoilage != null && costRecord.spoilage != ''){
					costRecord.spoilage = parseFloat(costRecord.spoilage);
				} else {
					costRecord.spoilage = 0;
				}
			} else {
				costRecord = null;
			}
			return false;
		});
		return costRecord;
	}
   
	/**
	 * @param {String} formatId Internal Id of the format
	 * @param {String} pageCntId Internal Id of the page count
	 * @returns {Array}
	 */
	function getEstimateAndGroup(formatId, pageCntId) {
		var searchEstimations = search.create({
			type : 'customrecord_cpm_estimation',
			filters : [
			           ['custrecord_cpm_printjobformat', 'anyof', formatId], 'and',
			           ['custrecord_cpm_formatpagecount', 'anyof', pageCntId]
			           ],
			columns : ['internalid', 'custrecord_cpm_estimation_ig']
		});
		var returnValue = [];
		searchEstimations.run().each(function(estimate){
			returnValue.push(estimate.getValue('internalid'));
			returnValue.push(estimate.getValue('custrecord_cpm_estimation_ig'));
			return false;
		});
		return returnValue;
	}
	
	/**
	 * @param {String} formatId Internal Id of the format
	 * @param {String} pageCntId Internal Id of the page count
	 * @returns {String}
	 */
	function getEstimateId(formatId, pageCntId) {
		var arr = getEstimateAndGroup(formatId, pageCntId);
		if(util.isArray(arr)){
			return arr[0];
		} else {
			return null;
		}
	}
	
	/**
	 * @param {String} formatId Internal Id of the format
	 * @param {String} pageCntId Internal Id of the page count
	 * @returns {String}
	 */
	function getGroupId(formatId, pageCntId) {
		var arr = getEstimateAndGroup(formatId, pageCntId);
		if(util.isArray(arr)){
			return arr[1];
		} else {
			return null;
		}
	}

       /**
	 * @param {String} Item id
	 * @param {String} item unit type
	 * @returns {String}
	 */
	function getItemPriceLevel(itemId,itemUnit,eachId,perJobId,perThousandId){
		var filterColumnPriceLevel,priceRecord = null,priceLevel = -1;
		switch(itemUnit){
		case eachId:
		case perJobId:
			filterColumnPriceLevel = ['pricing.pricelevel','is',1]
			break;
		case perThousandId:
			filterColumnPriceLevel = ['pricing.pricelevel','is',3]
			break;
		default:
			filterColumnPriceLevel = ['pricing.pricelevel','isnotempty',null]
		break;
		}

		search.create({
			type:search.Type.ITEM,
			columns:['internalid','pricing.pricelevel','pricing.unitprice'],
			filters:[filterColumnPriceLevel,'and',['internalid','is',itemId]]
		}).run().each(function(e){
			if(itemUnit != eachId && itemUnit != perThousandId && itemUnit != perJobId){
				priceRecord = {price: '0', unit: eachId, markup: '0'};
			}else{
				priceLevel = (itemUnit == perJobId || itemUnit == eachId)?1:3;
				priceRecord = {price:parseFloat(e.getValue({name:'unitprice',join:'pricing'})),unit:itemUnit,markup:'0',priceLevel:priceLevel}
			}
			return false;
		}) ;
		return priceRecord; 
	}

	
	//round the rate and cost values
	function round(value, precision) {
	    var multiplier = Math.pow(10, precision || 0);
	    return Math.round(value * multiplier) / multiplier;
	}
	
    return {
        getEstimateAndGroupID : getEstimateAndGroup,
        getEstimateId : getEstimateId,
        getItemGroupId : getGroupId,
        getCostRecord : getCostRecord,
        getBRCValues : getBRC,
        getPriceRecord : getPriceRecord,
        setLineValues : setLineValues,
        setCompleted : setAutomationComplete,
        getItemPriceLevel:getItemPriceLevel
    };
    
});
