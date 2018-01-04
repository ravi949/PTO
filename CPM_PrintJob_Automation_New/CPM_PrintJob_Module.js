define(['N/search',
		'N/record'
	],

function(search, record) {
  
	/**
	 * @param {String} required formatId Internal Id of the format
	 * @param {String} required pageCntId Internal Id of the page count
	 * @returns {Array}
	 */
	function getEstimateAndGroup(formatId, pageCntId) {
		try{
			var searchEstimations = search.load({
				type : 'customrecord_cpm_estimation',
				id: 'customsearch_cpm_get'
			});
			searchEstimations.filters.push(search.createFilter({
				name:'custrecord_cpm_printjobformat',
				operator: search.Operator.ANYOF,
				values: formatId
			}));
			searchEstimations.filters.push(search.createFilter({
				name:'custrecord_cpm_formatpagecount',
				operator: search.Operator.ANYOF,
				values: pageCntId
			}));
			
			var returnValue = [];
			searchEstimations.run().each(function(estimate){
				returnValue.push(estimate.getValue('internalid'));
				returnValue.push(estimate.getValue('custrecord_cpm_estimation_ig'));
				return false;
			});
			log.debug('returnValue',returnValue);
			return returnValue;
		}catch(e){
			log.error(ex.name, ex.message, true);
			return false;
		}
	}
	
	/**
	 * @param {String} searchId
	 * @param {String} groupId
	 * @param {String} printJobId
	 * @returns {Boolean}
	 */
	function addLineItems(searchId, groupId, printJobId,itemCatId,perJobId,mfgBRCItemId) {
		try{
			var itemGroupSearch = search.load({
				id : searchId
			});
			itemGroupSearch.filters.push(search.createFilter({
				name : 'internalid',
				operator : search.Operator.ANYOF,
				values : groupId
			}));
			var pj = record.load({
				type : record.Type.OPPORTUNITY, 
				id : printJobId,
				isDynamic: true
			});
			var versions = pj.getValue({fieldId: 'custbody_cpm_printjob_versions'}), 
				estqty = pj.getValue({fieldId: 'custbodyestqty'}),
				brcqty = pj.getValue({fieldId: 'custbody_cpm_printjob_brcquantity'}),
				flag = true;
			
			itemGroupSearch.run().each(function(line){
				var lQty = null, 
					itemId = line.getValue('memberItem'),
					iCat = line.getValue({name:'custitem_cpm_itemcategory', join:'memberItem'}), 
					verQty = line.getValue({name: 'custitem_cpm_item_version', join:'memberItem'}),
					mQty = line.getValue('memberQuantity'), 
					unit = line.getValue({name:'saleunit', join: 'memberItem'}),
					brcBuffer = line.getValue({name:'custitem_cpm_quantitybuffer', join: 'memberItem'});
				if (brcBuffer != '' && brcBuffer != null){
					brcBuffer = parseFloat(brcBuffer);
				} else {
					brcBuffer = 0;
				}
				if (itemId == mfgBRCItemId && iCat == itemCatId){// is BRC / Insert type  //newly added the brc item id compare
					lQty = mQty * brcqty * (1 + (brcBuffer/100));
				} else {// regular type
					lQty = (iCat == itemCatId)?mQty * brcqty:mQty * estqty;  //newly added for brcQty and estQty for BRC/Insert
					//lQty = mQty * estqty;
				}
				if (unit == perJobId) { //per job
					lQty = mQty;
					if (verQty) {
						lQty = lQty * parseInt(versions);
					}
				}
				//add line items
				pj.selectNewLine({sublistId : 'item'});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'item',
					value : itemId,
					ignoreFieldChange : false
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'quantity',
					value : lQty,
					ignoreFieldChange : true
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'price',
					value : -1,
					ignoreFieldChange : true
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'rate',
					value : 0,
					ignoreFieldChange : false
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'custcol_cpm_pj_include',
					value : true,
					ignoreFieldChange : true
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'custcoljobnbr',
					value : printJobId,
					ignoreFieldChange : true
				});
				pj.commitLine({
					sublistId : 'item'
				});
				return true;
			});
			pj.save({
				enableSourcing : false,
    			ignoreMandatoryFields : true  //mainly it is set false:- latest
			});
			return true;
		} catch(ex){
			log.error(ex.name, ex.message, true);
			return false;
		}
	}
	

	/**
	 * @param {String} searchId
	 * @param {String} estimateId
	 * @param {String} printJobId
	 * @param {String} vendorId
	 * @param {String} equipmentId
	 * @param {String} versions
	 * @returns {Boolean}
	 */
	function addPaperItems(searchId, estimateId, printJobId, vendorId, equipmentId, versions, printQty,perThousandId){
		try{
			var searchPaper = search.load({id:searchId});
			searchPaper.filters.push(search.createFilter({
				name : 'custrecord_cpm_est_paper_format',
				operator : search.Operator.ANYOF,
				values : estimateId
			}));
			searchPaper.filters.push(search.createFilter({
				name : 'custrecord_cpm_est_paper_vendor',
				operator : search.Operator.ANYOF,
				values : vendorId
			}));
			searchPaper.filters.push(search.createFilter({
				name : 'custrecord_cpm_est_paper_equipment',
				operator : search.Operator.ANYOF,
				values : equipmentId
			}));
			var sumAllowance = 0;
			searchPaper.run().each(function(estPapRec){	
				log.debug('estPapRec',estPapRec)
				var qty = null, isVersions = estPapRec.getValue({name:'custitem_cpm_paper_version', join:'CUSTRECORD_CPM_EST_PAPER_CONBY'});
				qty = parseFloat(estPapRec.getValue('custrecord_cpm_est_paper_amount')),
				defaultPaperItem = estPapRec.getValue('custrecord_cpm_est_paper_defaltpaperitem');
				var unit = estPapRec.getValue({name:'saleunit', join:'CUSTRECORD_CPM_EST_PAPER_CONBY'})
				if (isVersions) {
					qty = qty * parseInt(versions);
				} else if(unit==perThousandId){  //equal to per 1000
					qty = qty * parseInt(printQty) / 1000;
				}

				var paperRec = record.create({
					type : 'customrecord_cpm_paper_record',
					isDynamic : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_printjob',
					value : printJobId,
					fireSlavingSync : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_included',
					value : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_size',
					value : estPapRec.getValue('custrecord_cpm_est_paper_size'),
					fireSlavingSync : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_allowance',
					value : Math.round(qty)
				}).setValue({
					fieldId : 'custrecord_cpm_paper_consumedby',
					value : estPapRec.getValue('custrecord_cpm_est_paper_conby'),
					fireSlavingSync : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_allowanceper',
					value : estPapRec.getValue('custrecord_cpm_est_paper_amount')
				})
				
				//default paper item set to the newly created paper record
				if(defaultPaperItem != ''){
					paperRec.setValue({
						fieldId:'custrecord_cpm_paper_item',
						value:defaultPaperItem
					})
				}
				
				paperRec.save({
					enableSourcing : false,
	    			ignoreMandatoryFields : true
				});
				sumAllowance += qty;
				return true;			
			});
			log.debug('sumAllowance',sumAllowance)
			record.submitFields({
				type : record.Type.OPPORTUNITY,
				id : printJobId,
				values : {
					custbodypaperallowance : Math.round(sumAllowance)
				}
			});
			return true;
		} catch (ex) {
			log.error(ex.name, ex.message);
			return false;
		}
	}
	
	/**
	 * @param printJobId
	 * @returns
	 */
	function setAutomationFailed(printJobId){
		var printJob = record.load({
			type: record.Type.OPPORTUNITY,
			id: printJobId
		});
		printJob.setValue({
			fieldId:'custbody_cpm_automationstatus', 
			value:'4'
		});
		
		printJob.save({enableSourcing:true,ignoreMandatoryFields:true});  //main code:- latest
		log.audit('Failed', 'PrintJob marked Complete');
	}
	
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

		log.debug('objArray',objArray);
		
		objArray.forEach(function(lineValue){
			try{
				
				printJob.selectLine({
					sublistId: 'item',
					line: lineValue.lineNo
				});
				
				var estCost = 0,rate = 0, amount = 0;
				lineValue.priceLevel = (lineValue.priceLevel)?lineValue.priceLevel:-1
				lineValue.spoilage = parseFloat(lineValue.spoilage);
				
				if(lineValue.spoilage > 0){
					lineValue.quantity = (1+parseFloat(lineValue.spoilage)/100)*parseFloat(lineValue.quantity);
				}
				
				if (lineValue.itemPurchaseUnit == perThousandId){  //equal to per 1000
					estCost = lineValue.quantity * ((parseFloat(lineValue.cost))/1000);
				} else {
					estCost = lineValue.quantity * parseFloat(lineValue.cost);
				}
				
				if (lineValue.markup != null && lineValue.markup != '0' && lineValue.costfound){
					
					var calCost = (lineValue.item == mfgBrcItemId)?lineValue.cost:estCost; // taj added the new line for brc item condition
					
					if(lineValue.spoilage == 0){
						calCost = lineValue.cost;
					}
					
					//taj added this condition
					if(lineValue.itemUnit == eachId || lineValue.itemUnit == perJobId){   //equal to each
					    rate = calCost * (1 + parseFloat(lineValue.markup)/100);
					}

					if(lineValue.itemUnit == perThousandId){  //equal to per 1000
						 rate = calCost * (1 + parseFloat(lineValue.markup)/100);
					     amount = (lineValue.quantity * rate)/1000;
					}
					
				} else {
					rate = lineValue.price; 
					amount = 0;
					
					if (lineValue.itemUnit == perThousandId){  //equal to per 1000
						amount = parseFloat(rate) * ((lineValue.quantity)/1000);
					} else {
						amount = parseFloat(rate) * lineValue.quantity;
					}
				}
				
				
				//incremental price and cost value calculations				
				if(lineValue.itemUnit == 7){
					//price incremental calculations
					var estQty = parseFloat(printJob.getValue({fieldId :'custbodyestqty'}));
					var brcQty = parseFloat(printJob.getValue({fieldId:'custbody_cpm_printjob_brcquantity'}));
					lineValue.quantity = (lineValue.brcItem)?brcQty:estQty;
					lineValue.priceLevel = -1;
					
					var qtyFloor = parseFloat(lineValue.priceqtyfloor);
					var incQty = lineValue.quantity - qtyFloor;
					var incPrice = lineValue.incprice;
					var incAmount = (incPrice * incQty)/1000;
					incAmount = (incAmount)?incAmount:0;
					amount = incAmount + parseFloat(lineValue.price);

					//cost incremental calculation
					var costQtyFloor = parseFloat(lineValue.costqtyfloor);
					var incCostQty = lineValue.quantity - costQtyFloor;
					var estCostline = parseFloat(lineValue.inccost);
					var estcostamount = (incCostQty * estCostline)/1000;
					estcostamount = (estcostamount)?estcostamount:0;
					estCost = parseFloat(lineValue.cost)+estcostamount;
					
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_incpriceqty',
						value: incQty
					});
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_incprice',
						value: incPrice
					});
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_incpriceamt',
						value: incAmount
					});


					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_inccostqty',
						value: incCostQty // inc cost qty
					});
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_inccost',
						value: estCostline // inc cost
					});
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_cpm_inccostamt',
						value: estcostamount // inc cost amount
					});
				}
				
				
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'quantity',
					value: lineValue.quantity
				});
				
				if(lineValue.priceLevel != 0){
					printJob.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'price',
						value: lineValue.priceLevel
					});
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
				
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'costestimatetype',
					value: 'CUSTOM'
				});
				
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'costestimate',
					value: estCost
				});
				
				log.debug('item values '+lineValue.item,' pricelevel='+lineValue.priceLevel+' quantity='+lineValue.quantity+' costesimate='+estCost+' rate='+rate+' amount='+amount);
				
				printJob.commitLine({
					sublistId: 'item'
				});
			} catch(ex) {
				log.error('Commit Line', ex.name + ' ;; ' + ex.message);
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
		
		//forvolume filters
		priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_forvolume',search.Operator.IS,priceForVolume]);

		priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_forcustomer',search.Operator.IS,priceForCustomer]);
		//end
		
		//customer filters added based on customer id null or have value
		if(customerId != null){
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_customer',search.Operator.ANYOF,customerId]);
		}else{
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_customer',search.Operator.IS,'@NONE@']);
		}
		
		//vendor filters added based on vendor has value
		if(vendorId != null){
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_printer',search.Operator.ANYOF,vendorId]);
		}

	    //added the quantity filters based on isVolumePrice true or false
		if(isVolumePrice){
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_qtyfloor',search.Operator.LESSTHANOREQUALTO,quantity]);
			priceRecordSearch.filters.push('and',['custrecord_cpm_est_price_qtycap',search.Operator.GREATERTHANOREQUALTO,quantity]);
		}else{
			priceRecordSearch.filters.push('and',[[['custrecord_cpm_est_price_qtyfloor','isempty',null],'and',
     	     ['custrecord_cpm_est_price_qtycap','isempty',null]],'or',
     	    [['custrecord_cpm_est_price_qtyfloor','equalto',0],'and',
     	     ['custrecord_cpm_est_price_qtycap','equalto',0]]]);
		}
		
		//get search results in ascending order.
		var sortedColumn = search.createColumn({
	    	    name: 'internalid',
	    	    sort: search.Sort.ASC
	    });
		
		//search for the cpm estimation price records.
		var priceSearch = search.create({
			type:'customrecord_cpm_estimationprice',
			columns:[sortedColumn,
					'custrecord_cpm_est_price_itemprice',
					'custrecord_cpm_est_price_unit',
					'custrecord_cpm_est_cost_markup',
					'custrecord_cpm_est_cost_incrementprice',
			        'custrecord_cpm_est_price_qtyfloor'
					],
			filters:priceRecordSearch.filters
		});
		
		var priceRecord = null;
		priceSearch.run().each(function(result){
			log.debug('result '+itemId,result);
			priceRecord = {};
			if(result.id != null && result.id != ''){
				priceRecord.price = result.getValue({name: 'custrecord_cpm_est_price_itemprice'});
				priceRecord.unit = result.getValue({name: 'custrecord_cpm_est_price_unit'});
				priceRecord.markup = result.getValue({name: 'custrecord_cpm_est_cost_markup'});
				priceRecord.incprice = result.getValue({name: 'custrecord_cpm_est_cost_incrementprice'});//inc-price new field
				priceRecord.priceqtyfloor = result.getValue({name: 'custrecord_cpm_est_price_qtyfloor'});//inc-price new field
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
	
		//adding the cost filter if isVolumeCost true or false
		if(isVolumeCost){
			costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_qtyfloor',search.Operator.LESSTHANOREQUALTO,quantity]);
			costRecordSearch.filters.push('and',['custrecord_cpm_est_cost_qtycap',search.Operator.GREATERTHANOREQUALTO,quantity]);
		}else{
			costRecordSearch.filters.push('and',[[['custrecord_cpm_est_cost_qtyfloor','isempty',null],'and',
    	  	 ['custrecord_cpm_est_cost_qtycap','isempty',null]],'or',[
    	     ['custrecord_cpm_est_cost_qtyfloor','equalto',0],'and',
    	     ['custrecord_cpm_est_cost_qtycap','equalto',0]]
    	    ]);
		}

		//get search results in ascending order.
		var sortedColumn = search.createColumn({
	    	    name: 'internalid',
	    	    sort: search.Sort.ASC
	    });
		
		//search for the cpm estimation cost records.
		var costSearch = search.create({
			type:'customrecord_cpm_estimationcost',
			columns:[sortedColumn,
					'custrecord_cpm_est_cost_itemcost',
					'custrecord_cpm_est_cost_unit',
					'custrecord_cpm_est_cost_spoilagefactor',
					'custrecord_cpm_est_cost_incrementcost',
			        'custrecord_cpm_est_cost_qtyfloor'
					],
			filters:costRecordSearch.filters
		});
		var costRecord = null;
		costSearch.run().each(function(result){
			costRecord = {};
			if(result.id != null && result.id != ''){
				costRecord.cost = result.getValue({name: 'custrecord_cpm_est_cost_itemcost'});
				costRecord.unit = result.getValue({name: 'custrecord_cpm_est_cost_unit'});
				costRecord.spoilage = result.getValue({name: 'custrecord_cpm_est_cost_spoilagefactor'});
				costRecord.inccost = result.getValue({name: 'custrecord_cpm_est_cost_incrementcost'});//inc-cost new field
				costRecord.costqtyfloor = result.getValue({name: 'custrecord_cpm_est_cost_qtyfloor'});//inc-cost new field
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
    	addLineItems:addLineItems,
    	addPaperItems:addPaperItems,
    	getEstimateAndGroup:getEstimateAndGroup,
        getEstimateAndGroupID : getEstimateAndGroup,
        getEstimateId : getEstimateId,
        getItemGroupId : getGroupId,
        getCostRecord : getCostRecord,
        getBRCValues : getBRC,
        getPriceRecord : getPriceRecord,
        setLineValues : setLineValues,
        setCompleted : setAutomationComplete,
        setFailed : setAutomationFailed,
        getItemPriceLevel:getItemPriceLevel
    };
    
});
