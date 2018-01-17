/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search',
		'N/record',
		'N/runtime',
		'./CPM_PrintJob_Module.js'
		],

function(search,record,runtime,cpm) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	try{
    		return search.create({
    			type:search.Type.OPPORTUNITY,
    			columns:['internalid',
    				'custbody_cpm_printjob_format',
    				'custbody_cpm_printjob_pagecount',
    				'custbodyvndrawarder',
    				'custbody_cpm_printjob_equipment',
    				'custbody_cpm_printjob_versions',
    				'custbody_cpm_printjob_brcquantity',
    				'entity',
    				'custbodyestqty'
    				],
    				filters:[['custbody_cpm_automationstatus','is',6]]
    		});
    	}catch(ex){
    		log.debug('exception input data',ex.message);
    	}
    	
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		var scriptObj = runtime.getCurrentScript();
    		var searchResult = JSON.parse(context.value).values;
        	log.debug('searchResult',searchResult);
        	var pjid = searchResult['internalid']['value'];
        	var formatId = searchResult['custbody_cpm_printjob_format']['value'];
        	var equipmentId = searchResult['custbody_cpm_printjob_equipment']['value'];
        	var customerId = searchResult['entity']['value'];
        	var vendorId = searchResult['custbodyvndrawarder']['value'];
        	var pageCount = searchResult['custbody_cpm_printjob_pagecount']['value'];
    		var versions = searchResult['custbody_cpm_printjob_versions'];
    		var printQty = searchResult['custbodyestqty'];
    		var brcQty = searchResult['custbody_cpm_printjob_brcquantity'];
        	
    		var groupSearch = scriptObj.getParameter({name:'custscript_cpm_pj_mritemsearch'});
    		var paperSearch = scriptObj.getParameter({name:'custscript_cpm_pj_mrpapersearch'});
    		
        	//script parameter values
    		var itemCatId = scriptObj.getParameter({name:'custscript_cpm_pj_mrbrcinsert'}),
    		perThousandId = scriptObj.getParameter({name:'custscript_cpm_pj_mrper1000id'}),
    		perJobId = scriptObj.getParameter({name:'custscript_cpm_pj_mrperjobid'}),
    		mfgBRCItemId = scriptObj.getParameter({name:'custscript_cpm_pj_mrmfgbrc'}); 
        	
        	var arrEstAndGroup = cpm.getEstimateAndGroup(formatId, pageCount);
        	
        	if(arrEstAndGroup.length >0){
        		if(util.isArray(arrEstAndGroup)){
        			
        			record.submitFields({
        				type : record.Type.OPPORTUNITY,
        				id : pjid,
        				values : {
        					custbody_cpm_automationstatus : 1
        				}
        			});
        			
        			var estimateId = arrEstAndGroup[0];
        			var groupId = arrEstAndGroup[1];
        			var linesAdded = cpm.addLineItems(groupSearch, groupId, pjid,itemCatId,perJobId,mfgBRCItemId);
        			var paperAdded = cpm.addPaperItems(paperSearch, estimateId, pjid, vendorId, equipmentId, versions, printQty,perThousandId);
        			var value = JSON.stringify({
        				estimateId:estimateId,
        				estQty:printQty,
        				brcQty:brcQty,
        				customerId:customerId,
        				vendorId:vendorId,
        				itemCatId:itemCatId,
        				perThousandId:perThousandId,
        				perJobId:perJobId,
        				mfgBrcItemId:mfgBRCItemId
        			});
        			context.write(pjid,value);
        		}
        	}
    	}catch(ex){
    		cpm.setFailed(pjid);
    		log.debug('exception in map',ex.message);
    	}
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	try{
    		log.debug('context',context);
        	var printJobId = context.key;
        	var pjObj = JSON.parse(context.values[0]);
        	
        	log.debug('context reduce key',printJobId);
        	log.debug('context reduce values',pjObj);
        	
        	//get main values
        	var estimateId = pjObj.estimateId,
    		estQty = pjObj.estQty,
    		brcQty = pjObj.brcQty,
    		customer = pjObj.customerId,
    		vendor = pjObj.vendorId;
        	
        	//Mfg : BRC Item and Units ID's
    		var scriptObj = runtime.getCurrentScript(),
    		defaultVendor = scriptObj.getParameter({name:'custscript_cpm_pj_mrdefaultvendor'}),
    		brcVendor = scriptObj.getParameter({name:'custscript_cpm_pj_mrbrcdefaultvendor'}),
    		eachId = scriptObj.getParameter({name:'custscript_cpm_mreachid'}),
    		mfgBrcItemId = pjObj.mfgBrcItemId,
    		perJobId = pjObj.perJobId,
    		perThousandId = pjObj.perThousandId,
    		brcInsertCatId = pjObj.itemCatId;
        	
    		//loading the print job
        	var printJob = record.load({
    			type : record.Type.OPPORTUNITY,
    			id : printJobId,
    			isDynamic : true
    		});
        	
        	var itemLineCount = printJob.getLineCount({sublistId : 'item'});
    		if (itemLineCount > 0){
    			var lineValues = [], flag = false;
    			for(var i = 0; i < itemLineCount; i++){
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
    				itemUnit = printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'units'});
    				itemPurchaseUnit = search.create({
    					type:search.Type.ITEM,
    					columns:['purchaseunit'],
    					filters:[['internalid','is',itemId]]
    				}).run().getRange(0,1)[0].getValue('purchaseunit');

    				var customerId = customer;
    				if (include){//line is included
    					if (itemId != mfgBrcItemId){ //mfg Brc Item

    						//get cost
							hasVolumeCost = (hasVolumeCost == 'T')?true:false;
							hasVendorCost = (hasVendorCost == 'T')?true:false;
							vendorId = (selVendor != '' && selVendor != null)? selVendor : vendor;

							//getting the cost record and customer condition
							function getCostRecordList(vendorId,hasVolumeCost,forVolume){
								costRecord = cpm.getCostRecord(estimateId, itemId, customerId,vendorId, quantity, hasVolumeCost,forVolume);  //true for forvolume
								if(costRecord == null)
									costRecord = cpm.getCostRecord(estimateId, itemId, null,vendorId, quantity, hasVolumeCost,true);
								return costRecord;
							}

							//Cost calculations scenario's					
							if(hasVolumeCost && hasVendorCost ){ //scenario G		
								vendorId = (selVendor != '' && selVendor != null)? selVendor : vendor;
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
							
							//Price calculation scenario's
							var hasCustomerPrice = (hasCustomerPrice == 'T')?true:false; //taj added
							var isVolumePrice = (hasVolumePricing == 'T')?true:false; //taj added

							customerId = (hasCustomerPrice)? customerId : null;
							vendorId = (selVendor != '' && selVendor != null)? selVendor : vendor;
						
							if(costRecord.spoilage > 0 && itemPurchaseUnit != perJobId) //equal to perjob
								quantity = parseFloat(quantity)*(1 + parseFloat(costRecord.spoilage)/100);
							
							if(isVolumePrice && hasCustomerPrice){  //scenario B
								log.debug('scenario B',itemId);
								priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,true,true); // custrecord_cpm_est_price_forvolume is true and forcustomer true			
							}

							if(priceRecord == null && isVolumePrice){ //scenario D
								log.debug('scenario D',itemId);
								customerId = null;
								priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,true,false); // custrecord_cpm_est_price_forvolume is true						
							}

							if(priceRecord == null  && isVolumePrice ){ //scenario D price level
								priceRecord = 	cpm.getItemPriceLevel(itemId,itemUnit,eachId,perJobId,perThousandId);
							}

							if(!isVolumePrice && hasCustomerPrice){ //scenario A
								log.debug('scenario A',itemId);
								priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,false,true); 
							}

							if(priceRecord == null){   //scenario c
								log.debug('scenario C',itemId);
								customerId = null;
								priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,false,false); //price_forvolume is false						
							}

							if (priceRecord == null) {
								priceRecord = {price: '0', unit: '-1', markup: '0'};
							}
    						
    						lineValues.push({
    							lineNo: printJob.getCurrentSublistIndex({sublistId:'item'}),
    							item: itemId,
    							quantity: quantity,
    							cost: costRecord.cost,
    							spoilage: costRecord.spoilage,
    							price: priceRecord.price,
    							markup: priceRecord.markup,
    							itemUnit: itemUnit,
    							itemPurchaseUnit:itemPurchaseUnit,
    							priceLevel:priceRecord.hasOwnProperty('priceLevel')?priceRecord.priceLevel:undefined,
    							costfound:costRecord.found,
    							brcItem:(brcInsertCatId == itemCategory),
								incprice:(priceRecord.incprice)?priceRecord.incprice:0,//inc-price new column
								priceqtyfloor:(priceRecord.priceqtyfloor)?priceRecord.priceqtyfloor:0, //inc-price new column
								inccost:(costRecord.inccost)?costRecord.inccost:0,//inc-cost new column,
								costqtyfloor:(costRecord.costqtyfloor)?costRecord.costqtyfloor:0 //inc-cost new column
    						});
    					} else {
    						var vendorId = (selVendor != '' && selVendor != null)? selVendor : brcVendor ; //default brc vendor
    						log.debug('brc quantity',quantity);
    						brcRecord = cpm.getBRCValues(itemId, vendorId, quantity);
    						if(brcRecord == null) brcRecord = {cost: '0', unit: '-1', spoilage: '0', markup:'0',found:true};
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
    							priceLevel:undefined,
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
    						itemUnit: printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'unit'}),
    						itemPurchaseUnit:itemPurchaseUnit,
    						priceLevel:undefined,
    						costfound:false,
    						brcItem:(brcInsertCatId == itemCategory),
	    					incprice:0,//inc-price new column
	    					priceqtyfloor:0, //inc-price new column
	    	    			inccost:0,//inc-cost new column
	    	    			costqtyfloor:0 //inc-cost new column
    					});
    				}
    			}
    			var completed = cpm.setLineValues(printJobId, lineValues, eachId, perJobId, perThousandId,mfgBrcItemId);
    			cpm.setCompleted(printJobId);
    		}
    	}catch(ex){
    		cpm.setFailed(printJobId);
    		log.debug('exception in reduce',ex.message);
    	}
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	log.debug('summary',summary);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
