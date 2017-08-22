/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([
	'N/record', 
    'N/runtime',
    'N/redirect',
    'N/search',
    './CPM_PrintJob_Module'
    ],
	
function(record, runtime, redirect, search, cpm) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	log.audit('recalc_Start', 'started for :' + context.request.parameters.pjid)
    	var printJobId = context.request.parameters.pjid;
    	var startFrom = (context.request.parameters.fline == null || typeof context.request.parameters.fline == 'undefined')? 0 : context.request.parameters.fline;
    	var printJob = record.load({
    		type : record.Type.OPPORTUNITY,
    		id : printJobId,
    		isDynamic : true
    	});
    	//get main values
		var estimateId = cpm.getEstimateId(printJob.getValue({fieldId : 'custbody_cpm_printjob_format'}), printJob.getValue({fieldId : 'custbody_cpm_printjob_pagecount'})),
			customerId = printJob.getValue({fieldId : 'entity'}),
			vendor = printJob.getValue({fieldId : 'custbodyvndrawarder'});
		
		//Script parameters
		var scriptObj = runtime.getCurrentScript(),
		defaultVendor = scriptObj.getParameter({name:'custscript_cpm_pj_recaldefaultvendor'}),
		brcVendor = scriptObj.getParameter({name:'custscript_cpm_pj_recaldefaultbrcvendor'}),
		mfgBrcItemId = scriptObj.getParameter({name:'custscript_cpm_pj_recalmfgbrcitem'}),
		eachId = scriptObj.getParameter({name:'custscript_cpm_pj_recaleach'}),
		perJobId = scriptObj.getParameter({name:'custscript_cpm_pj_recalperjob'}),
		perThousandId = scriptObj.getParameter({name:'custscript_cpm_pj_recalper1000'});


    	var itemLineCount = printJob.getLineCount({sublistId : 'item'});
    	if (itemLineCount > 0){
    		var lineValues = [], flag = false;
    		for(var i = startFrom; i < itemLineCount; i++){
    			try{
    				printJob.selectLine({
        				sublistId : 'item',
        				line : i 
        			});
        			var include = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'custcol_cpm_pj_include'});
    				var costRecord = null, priceRecord = null, brcRecord, costUnitFactor = 1, priceUnitFactor = 1;
	    			//get line values
	    			var itemId = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'item'}),
	    				hasCustomerPrice = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'custcol_cpm_hascustomerpricing'}),
	    				hasVolumePricing = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'custcol_cpm_hasquantitypricing'}),
	    				hasVendorCost = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'custcol_cpm_hasvendorcost'}),
	    				hasVolumeCost = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'custcol_cpm_hasvolumecost'}),
	    				selVendor = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'custcolvendorselection'}),
	    				itemCategory = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'custcol_cpm_itemcategory'}),
	    				quantity = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'quantity'}),
	    				itemUnit = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'units'}),
	    				itemPurchaseUnit = search.create({
	    					type:search.Type.ITEM,
	    					columns:['purchaseunit'],
	    					filters:[['internalid','is',itemId]]
	    				}).run().getRange(0,1)[0].getValue('purchaseunit');

    	    		if (include){
    	    			if (itemId != mfgBrcItemId){  //not equal to mfg:brc item
    	    				
    	    				//get cost
    	    				hasVolumeCost = (hasVolumeCost == 'T')?true:false;
    	    				hasVendorCost = (hasVendorCost == 'T')?true:false;
    	    				var vendorId = (selVendor != '' && selVendor != null)? selVendor : vendor;

    	    				//gettting the cost record and customer condition
    	    				function getCostRecordList(vendorId,hasVolumeCost,forVolume){
    	    					costRecord = cpm.getCostRecord(estimateId, itemId, customerId,vendorId, quantity, hasVolumeCost,forVolume);  //true for forvolume
    	    					if(costRecord == null)
    	    						costRecord = cpm.getCostRecord(estimateId, itemId, null,vendorId, quantity, hasVolumeCost,true);
    	    					if(costRecord == null)
    	    						costRecord = cpm.getCostRecord(estimateId, itemId, customerId,vendor, quantity, hasVolumeCost,forVolume);
    	    					if(costRecord == null)
    	    						costRecord = cpm.getCostRecord(estimateId, itemId, null,vendor, quantity, hasVolumeCost,forVolume);
    	    					return costRecord;
    	    				}
    	    				
    	    				//Cost calculations scenario's					
							if(hasVolumeCost && hasVendorCost ){ //scenario G		
								vendorId = (selVendor != '' && selVendor != null)? selVendor : vendorId;
								costRecord = getCostRecordList(vendorId,hasVolumeCost,true); //true for forvolume
							}

							if(costRecord == null && hasVolumeCost){ //scenario H
								vendorId = (selVendor != '' && selVendor != null)? selVendor : defaultVendor ;  //else default vendor
								costRecord = getCostRecordList(vendorId,hasVolumeCost,true); //true for forvolume
							}	

							if(costRecord == null && (hasVendorCost && !hasVolumeCost)){ //scenario E
								costRecord = getCostRecordList(vendorId,hasVolumeCost,false); //false for forvolume
							}

							if (costRecord == null && !hasVolumeCost){ //scenrio F
								vendorId = (selVendor != '' && selVendor != null)? selVendor : defaultVendor ; //else default vendor
								costRecord = getCostRecordList(vendorId,hasVolumeCost,false); //false for forvolume
							}

							if (costRecord == null) {
								costRecord = {cost: '0', unit: '-1', spoilage: '0',found:false};
							}
							//end
    		    			
    	    				//get Price
    	    				var hasCustomerPrice = (hasCustomerPrice == 'T')?true:false; //taj added
    	    				var isVolumePrice = (hasVolumePricing == 'T')?true:false; //taj added

    	    				customerId = (hasCustomerPrice)? customerId : null;
    	    				vendorId = (selVendor != '' && selVendor != null)? selVendor : vendor;
  
    	    				//taj added these two scenarios B & D
    	    				if(isVolumePrice && hasCustomerPrice){  //scenario B
    	    					log.debug('scenario B',itemId);
    	    					priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,true,true); // custrecord_cpm_est_price_forvolume is true and forcustomer true
    	    					if(priceRecord == null)
    	    						priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendor, quantity, isVolumePrice,true,true);
    	    				}

    	    				if(priceRecord == null && isVolumePrice){ //scenario D
    	    					log.debug('scenario D',itemId);
    	    					customerId = null;
    	    					priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,true,false); // custrecord_cpm_est_price_forvolume is true
    	    					if(priceRecord == null)
    	    						priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendor, quantity, isVolumePrice,true,false);
    	    				}

    	    				if(priceRecord == null  && isVolumePrice ){ //scenario D price level
    	    					priceRecord = cpm.getItemPriceLevel(itemId,itemUnit,eachId,perJobId,perThousandId);
    	    				}

    	    				if(!isVolumePrice && hasCustomerPrice){ //scenario A
    	    					log.debug('scenario A',itemId);
    	    					priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,false,true);
    	    					if(priceRecord == null)
    	    						priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendor, quantity, isVolumePrice,false,true);
    	    				}

    	    				if(priceRecord == null){   //scenario c
    	    					log.debug('scenario C',itemId);
    	    					customerId = null;
    	    					priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,false,false); //price_forvolume is false
    	    					if(priceRecord == null)
    	    						priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendor, quantity, isVolumePrice,false,false);
    	    				}

    	    				if (priceRecord == null) {
    	    					priceRecord = {price: '0', unit: '-1', markup: '0'};
    	    				}
    	    				//taj added lines ended

    	    				lineValues.push({
    	    					lineNo: printJob.getCurrentSublistIndex({sublistId:'item'}),
    	    					item: itemId,
    	    					quantity: quantity,
    	    					cost: costRecord.cost,
    	    					spoilage: costRecord.spoilage, //before code placed the zero
    	    					price: priceRecord.price,
    	    					markup: priceRecord.markup,
    	    					itemUnit: itemUnit,
    	    					itemPurchaseUnit:itemPurchaseUnit,
    	    					priceLevel:0,//priceRecord.hasOwnProperty('priceLevel')?priceRecord.priceLevel:undefined,
    	    					costfound:costRecord.found
    	    				});
    	    			} else {
    	    				var vendorId = (selVendor != '' && selVendor != null)? selVendor : brcVendor; //default brc vendor
    	    				brcRecord = cpm.getBRCValues(itemId, vendorId, quantity);
    	    				if(brcRecord == null) brcRecord = {cost: '0', unit: '-1', spoilage: '0', markup:'0'};
    	    				lineValues.push({
    	    					lineNo: printJob.getCurrentSublistIndex({sublistId:'item'}),
    	    					item: itemId,
    	    					quantity: quantity,
    	    					cost: brcRecord.cost,
    	    					spoilage: '0',
    	    					price: '0',
    	    					markup: brcRecord.markup,
    	    					itemUnit: itemUnit,
    	    					itemPurchaseUnit:itemPurchaseUnit,
    	    					priceLevel:0,
    	    					costfound:true
    	    				});
    	    			}
        			} else {
        				lineValues.push({
        					lineNo: printJob.getCurrentSublistIndex({sublistId:'item'}),
        					item: itemId,
        					quantity: quantity,
        					cost: '0',
        					spoilage: '0',
        					price: '0',
        					markup: '0',
        					itemUnit: printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'units'}),
        					itemPurchaseUnit:itemPurchaseUnit,
        					priceLevel:0,
        					costfound:false
        				});
        			}
        			if(runtime.getCurrentScript().getRemainingUsage() <= 400){
        				flag = true;
        				startFrom = i;
        				break;
        			}
    			}catch (ex){
    				log.error({
    					title: 'Recalc_Error',
    					details: ex.name + '; ' + ex.message + '; ' + 'line number :' + i
    				});
    			}
    		}
    		var completed = cpm.setLineValues(printJobId, lineValues, eachId, perJobId, perThousandId,mfgBrcItemId);
    		if (flag) {
    			log.audit('LineValues_RESTART', 'Ended At: ' + + startFrom.toString() + '; Remaining Usage : ' + runtime.getCurrentScript().getRemainingUsage());
    			redirect.toSuitelet({
    				scriptId: scriptObj.id,
					deploymentId: scriptObj.deploymentId,
    				parameters: {
    					'pjid' : context.request.parameters.pjid,
    					'fline' : startFrom + 1
    					}
    			});
    		} else {
    			cpm.setCompleted(context.request.parameters.pjid);
    			log.audit('LineValues_END', 'Remaining Usage : ' + runtime.getCurrentScript().getRemainingUsage());
    			redirect.toSuitelet({
    				scriptId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_suitelet4id'}),
    				deploymentId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_suitelet4deploymentid'}),
    				parameters: {
    					'pjid' : context.request.parameters.pjid
    					}
    			});
    		}
    	}else{
    		log.error('','There are no Estimation records found for the Format and Page Count entered on the Print Job(Internal Id: '+printJobId+').');
			redirect.toRecord({
				type : record.Type.OPPORTUNITY, 
				id : printJobId 
			});
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
