/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Requires script parameters - 
 * Default BRC Vendor - 'custscript_linevalues_brcven'
 * Default Vendor - 'custscript_linevalues_defven'
 * This Suitelet's ID - 'custscript_cpm_pja_v2_thissuitelet'
 * This Deployment's ID - 'custscript_cpm_pja_v2_thisdeployment'
 */
define(['N/record', 
        'N/runtime',
        'N/redirect',
        'N/search',
        './CPM_PrintJob_AutomationModule'
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
		try{
			var printJobId = context.request.parameters.pjid,paramObj;
			var startFrom = (context.request.parameters.fline == null || typeof context.request.parameters.fline == 'undefined')? 0 : context.request.parameters.fline;
			log.audit('LineValues_START', 'Start From: ' + startFrom.toString());
			var printJob = record.load({
				type : record.Type.OPPORTUNITY,
				id : printJobId,
				isDynamic : true
			});
			//get main values
			var estimateId = cpm.getEstimateId(printJob.getValue({fieldId : 'custbody_cpm_printjob_format'}), printJob.getValue({fieldId : 'custbody_cpm_printjob_pagecount'})),
			estQty = printJob.getValue({fieldId : 'custbodyestqty'}),
			brcQty = printJob.getValue({fieldId : 'custbody_cpm_printjob_brcquantity'}),
			customer = printJob.getValue({fieldId : 'entity'}),
			vendor = printJob.getValue({fieldId : 'custbodyvndrawarder'});

			var defaultBrcVendor = 'brcvendor';

			//Mfg : BRC Item and Units ID's
			var scriptObj = runtime.getCurrentScript(),
			defaultVendor = scriptObj.getParameter({name:'custscript_linevalues_defven'}),
			brcVendor = scriptObj.getParameter({name:'custscript_linevalues_brcven'}),
			mfgBrcItemId = scriptObj.getParameter({name:'custscript_cpm_pja_s2_mfgbrc_id'}),
			eachId = scriptObj.getParameter({name:'custscript_cpm_pja_s2_eachid'}),
			perJobId = scriptObj.getParameter({name:'custscript_cpm_pja_s2_perjob_id'}),
			perThousandId = scriptObj.getParameter({name:'custscript_cpm_pja_s2_per1000_id'}),
			brcInsertCatId = scriptObj.getParameter({name:'custscript_cpm_pja_s2_brcitemcategory'});
			log.debug('brcInsertCatId',brcInsertCatId)

			var itemLineCount = printJob.getLineCount({sublistId : 'item'});
			if (itemLineCount > 0){
				var lineValues = [], flag = false;
				for(var i = startFrom; i < itemLineCount; i++){
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
							var vendorId = (selVendor != '' && selVendor != null)? selVendor : vendor;

							//gettting the cost record and customer condition
							function getCostRecordList(vendorId,hasVolumeCost,forVolume){
								costRecord = cpm.getCostRecord(estimateId, itemId, customerId,vendorId, quantity, hasVolumeCost,forVolume);  //true for forvolume
								if(costRecord == null)
									costRecord = cpm.getCostRecord(estimateId, itemId, null,vendorId, quantity, hasVolumeCost,true);
								return costRecord;
							}

							//cost scenarios
							//Tajuddin Added the scenario G and H					
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

							/*if (costRecord == null && customerId != null){
		    					customerId = null;
		    					costRecord = cpm.getCostRecord(estimateId, itemId, customerId, vendorId, quantity, hasVolumeCost,false); //false for forvolume
		    			    }		    			
		    				if (costRecord == null && vendorId != 'defaultVendor'){
		    					vendorId = 'defaultVendor';
		    					costRecord = cpm.getCostRecord(estimateId, itemId, customerId, vendorId, quantity, hasVolumeCost,false); //false for forvolume
		    				}
		    				if (costRecord == null && vendorId == 'defaultVendor' && customerId == null) {
								costRecord = {cost: '0', unit: '-1', spoilage: '0',found:false};
		    				}*/

							//get Price
							var hasCustomerPrice,isVolumePrice; //taj added
							hasCustomerPrice = (hasCustomerPrice == 'T')?true:false; //taj added
							isVolumePrice = (hasVolumePricing == 'T')?true:false; //taj added

							customerId = (hasCustomerPrice)? customer : null;
							//var isVolumePrice = hasVolumePricing;
							vendorId = (selVendor != '' && selVendor != null)? selVendor : vendor;
							//quantity = parseFloat(quantity)*(1 + parseFloat(costRecord.spoilage)/100);

							/*these line added by taj*/
							if(costRecord.spoilage>0 && itemPurchaseUnit != perJobId) //equal to perjob
								quantity = parseFloat(quantity)*(1 + parseFloat(costRecord.spoilage)/100);
							/*end*/

							//priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice);  
							log.debug('isVolumePrice '+itemId,isVolumePrice)
							//taj added these two scenarios B & D
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
							//taj added lines ended
								//price scenarios
								/*if(priceRecord == null && customerId != null){   //scenario c
		    					customerId = null;
		    					priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice,false); //price_forvolume is false						
		    				}

							if(priceRecord == null  && isVolumePrice == 'T'){
								priceRecord = 	cpm.getItemPriceLevel(itemId,itemUnit,eachId,perJobId,perThousandId);
							}

		    				if (priceRecord == null && isVolumePrice){
		    					isVolumePrice = false;
		    					priceRecord = cpm.getPriceRecord(estimateId, itemId, customerId, vendorId, quantity, isVolumePrice);
		    				}
		    				if (priceRecord == null && customerId == null && !isVolumePrice) {
		    					priceRecord = {price: '0', unit: '-1', markup: '0'};
		    				}*/
							lineValues.push({
								lineNo: printJob.getCurrentSublistIndex({sublistId:'item'}),
								item: itemId,
								quantity: quantity,
								cost: costRecord.cost,
								spoilage: costRecord.spoilage,
								costUnit: costRecord.unit,
								price: priceRecord.price,
								priceUnit: priceRecord.unit,
								markup: priceRecord.markup,
								itemUnit: itemUnit,
								itemPurchaseUnit:itemPurchaseUnit,
								priceLevel:priceRecord.hasOwnProperty('priceLevel')?priceRecord.priceLevel:undefined,
										costfound:costRecord.found
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
								costUnit: brcRecord.unit,
								price: '0',
								priceUnit: '0',
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
							costUnit: null,
							price: '0',
							priceUnit: null,
							markup: '0',
							itemUnit: printJob.getCurrentSublistValue({sublistId : 'item', fieldId : 'unit'}),
							itemPurchaseUnit:itemPurchaseUnit,
							priceLevel:undefined,
							costfound:false
						});
					}
					if(runtime.getCurrentScript().getRemainingUsage() <= 400){
						flag = true;
						startFrom = i;
						break;
					}
				}
				var completed = cpm.setLineValues(printJobId, lineValues, eachId, perJobId, perThousandId,mfgBrcItemId);
				if (flag) {
					log.audit('LineValues_RESTART', 'Ended At: ' + + startFrom.toString() + '; Remaining Usage : ' + runtime.getCurrentScript().getRemainingUsage());
					
					if(context.request.parameters.from == 'cc'){
						paramObj = { 'pjid' : context.request.parameters.pjid,
							'fline' : startFrom + 1 ,from:'cc'}
					}else{
						paramObj = { 'pjid' : context.request.parameters.pjid,
								'fline' : startFrom + 1}
					}
					
					redirect.toSuitelet({
						scriptId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_v2_thissuitelet'}),
						deploymentId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_v2_thisdeployment'}),
						parameters: paramObj
					});
					
				} else {
					cpm.setCompleted(context.request.parameters.pjid);
					log.audit('LineValues_END', 'Remaining Usage : ' + runtime.getCurrentScript().getRemainingUsage());
					
					if(context.request.parameters.from == 'cc'){
						redirect.toSuitelet({
	    					scriptId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_cc_recordview_scriptid'}),
	    					deploymentId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_cc_recordview_dpid'}),
	    					parameters : {'pjid':context.request.parameters.pjid}
	    				});
						
					}else{
						redirect.toRecord({
							type: record.Type.OPPORTUNITY,
							id: context.request.parameters.pjid,
							isEditMode: false
						});
					}
				}
			}
		} catch (ex) {
			log.error(ex.name, ex.message);
			return false;
		}
	}

	return {
		onRequest: onRequest
	};

});