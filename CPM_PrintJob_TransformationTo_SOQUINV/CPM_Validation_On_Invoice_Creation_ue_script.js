/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect', 'N/search', 'N/ui/serverWidget'],
		/**
		 * @param {record} record
		 * @param {redirect} redirect
		 * @param {search} search
		 */
		function(record, redirect, search, serverWidget) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {
		if(scriptContext.type =='create'){
			var rec = scriptContext.newRecord,
			itemLength = rec.getLineCount('item'),
			printjobId = rec.getValue('createdfrom');    		
			/*if(printjobId){    			
			var printjobRec = search.create({
				type:search.Type.OPPORTUNITY,
				columns: ['internalid'],
				filters: [['internalid','is',printjobId]]
			}).run().getRange(0,10);
    		//checking the record whether it is created from Print Job or not
			if(printjobRec.length > 0){
				//getting the Estimate records list
    			var estimateRecords = search.create({
					type:search.Type.ESTIMATE,
					columns: ['internalid'],
					filters: [['opportunity','is',printjobId],'and',['mainline','is','T']]
				}).run().getRange(0,10);
    			//condition triggers when creating an Invoice from Print Job
    			if(rec.type =='invoice'){
    				if(estimateRecords.length > 0){

    	    			scriptContext.form.clientScriptModulePath ='./CPM_Validation_On_Inv_Creation_client_script.js';
    					redirect.toRecord({
    					    type : record.Type.OPPORTUNITY, 
    					    id : printjobId 
    					});
//    					throw Error('An Invoice cannot be created directly as there are Estimates associated to this Print Job');
    				}
    			}    			
			}    	
		}*/
			/*if(rec.type =='invoice' && itemLength > 0){
			try{
				for(var v = itemLength-1 ; v>= 0; v--){

		    		var itemInclude = rec.getSublistValue({
		    			sublistId: 'item',
		    			fieldId: 'custcol_cpm_pj_include',
		    			line: v
		    		});

		    		var itemEstExtCost = rec.getSublistValue({
		    			sublistId: 'item',
		    			fieldId: 'costestimate',
		    			line: v
		    		});

		    		var itemAmount = rec.getSublistValue({
		    			sublistId: 'item',
		    			fieldId: 'amount',
		    			line: v
		    		});
		    		if(itemInclude == false || (itemEstExtCost == 0 && itemAmount == 0)){
		    			rec.removeLine({
		    				sublistId: 'item',
		    				line: v,
		    				ignoreRecalc: true
		    			});
		    		}
				}
			}catch(e){
				log.debug('exception occures',e)
			}
		}*/
			if(printjobId){
				var itemList = [];
				for(var v = itemLength-1 ; v>= 0; v--){

					var itemInclude = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_pj_include',
						line: v
					});

					var itemEstExtCost = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'costestimate',
						line: v
					});

					var itemAmount = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'amount',
						line: v
					});

					var itemId = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'item',
						line: v
					});
					var itemBackordered = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'backordered',
						line: v
					});
					var itemQuantity = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'quantity',
						line: v
					});
					var itemUnits = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'units',
						line: v
					});
					var itemDescription = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'description',
						line: v
					});
					var itemPricelevels = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'pricelevels',
						line: v
					});
					var itemRate = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'rate',
						line: v
					});
					var itemTax = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'taxableamt',
						line: v
					});
					var itemOptions = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'options',
						line: v
					});
					var itemCostestimatetype = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'costestimatetype',
						line: v
					});
					var itemCustcolvendorselection= rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcolvendorselection',
						line: v
					});
					var itemCustcoljobnbr= rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcoljobnbr',
						line: v
					});
					var itemFactor= rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_factor',
						line: v
					});
					var itemInclude= rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_pj_include',
						line: v
					});
					if(itemInclude == true && (itemEstExtCost > 0 || itemAmount > 0)){
						itemList.push({
							itemId:itemId
							,itemEstExtCost:itemEstExtCost
							,itemAmount:itemAmount
							,itemBackordered:itemBackordered
							,itemQuantity:itemQuantity
							,itemUnits:itemUnits
							,itemDescription:itemDescription
							,itemPricelevels:itemPricelevels
							,itemRate:itemRate
							,itemTax:itemTax
							,itemOptions:itemOptions
							,itemCostestimatetype:itemCostestimatetype
							,itemCustcolvendorselection:itemCustcolvendorselection
							,itemCustcoljobnbr:itemCustcoljobnbr
							,itemFactor:itemFactor
							,itemInclude:itemInclude 
						})
					}
					rec.removeLine({
						sublistId: 'item',
						line: v,
						ignoreRecalc: true
					});
				}	
				itemList.forEach(function(e,v){
					if(e.itemEstExtCost)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'costestimate',
							line: v,
							value: e.itemEstExtCost
						});
					else
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'costestimate',
							line: v,
							value: 0
						});
					if(e.itemAmount)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: v,
							value: e.itemAmount
						});
					else
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: v,
							value: 0
						});
					if(e.itemId)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: v,
							value: e.itemId
						});
					if(e.itemBackordered)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'backordered',
							line: v,
							value: e.itemBackordered
						});
					if(e.itemQuantity)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'quantity',
							line: v,
							value: e.itemQuantity
						});
					if(e.itemUnits)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'units',
							line: v,
							value: e.itemUnits
						});
					if(e.itemDescription)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'description',
							line: v,
							value: e.itemDescription
						});
					if(e.itemPricelevels)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'pricelevels',
							line: v,
							value: e.itemPricelevels
						});
					if(e.itemRate)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: v,
							value: e.itemRate
						});
					else 
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: v,
							value: 0
						});
					if(e.itemTax)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxableamt',
							line: v,
							value: e.itemTax
						});
					if(e.itemOptions)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'options',
							line: v,
							value: e.itemOptions
						});
					if(e.itemCostestimatetype)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'costestimatetype',
							line: v,
							value: e.itemCostestimatetype
						});
					if(e.itemCustcolvendorselection)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcolvendorselection',
							line: v,
							value: e.itemCustcolvendorselection
						});
					if(e.itemCustcoljobnbr)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcoljobnbr',
							line: v,
							value: e.itemCustcoljobnbr
						});
					else{
						var printjobRec = search.create({
							type:search.Type.OPPORTUNITY,
							columns: ['internalid'],
							filters: [['internalid','is',printjobId]]
						}).run().getRange(0,10);
			    		//checking the record whether it is created from Print Job or not
						if(printjobRec.length > 0){
							rec.setSublistValue({
								sublistId: 'item',
								fieldId: 'custcoljobnbr',
								line: v,
								value: printjobId
							});
						}
					}
					if(e.itemFactor)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_cpm_factor',
							line: v,
							value: e.itemFactor
						});
					if(e.itemInclude)
						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_cpm_pj_include',
							line: v,
							value: e.itemInclude
						});
				})
			}
		}
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

	}

	return {
		beforeLoad: beforeLoad
//		beforeSubmit: beforeSubmit,
//		afterSubmit: afterSubmit
	};

});
