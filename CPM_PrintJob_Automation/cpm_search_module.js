define(['N/search','N/record'],	
		function(search,record) {

	//get Item Group Search
	function getItemGroups(itemGroupColumn,itemGroupFilter){
		return search.create({
			type:search.Type.ITEM_GROUP,
			columns:itemGroupColumn,
			filters:itemGroupFilter
		}).run().getRange(0,10);
	}


	//get member items from the item group
	function getMemberItems(itemGroupColumn,itemGroupFilter){
		var memberItem_result = search.create({
			type:search.Type.ITEM_GROUP,
			columns:itemGroupColumn,
			filters:itemGroupFilter
		}).run().getRange(0,1000);

		return memberItem_result.sort(function(s1,s2){
			var s1lower = s1.getText('memberitem').toLowerCase();
			var s2lower = s2.getText('memberitem').toLowerCase();
			return s1lower > s2lower? 1 : -1 ;
		})   

	}

	//search for CPM-ESTIMATION custom record 
	function getCpmEstimation(cpmEstColumns,cpmEstFilters){ 	 
		var cpmest = search.create({
			type:'customrecord_cpm_estimation',
			columns:cpmEstColumns,
			filters:cpmEstFilters
		}).run().getRange(0,2);
		return cpmest; 
	}


	//search on CPM-Estimation-Price 
	function getcpmEstimationPrice(cpmEstColumns,cpmEstFilters){
		return search.create({
			type:'customrecord_cpm_estimationprice',
			columns:cpmEstColumns,
			filters:cpmEstFilters
		}).run().getRange(0,10);
	}


	//Search CPM-Estimation-Cost for 
	function getCpmEstimationCost(cpmEstimationCostColumns,cpmEstimationCostFilters,message){
		return search.create({
			type:'customrecord_cpm_estimationcost',
			columns:cpmEstimationCostColumns,
			filters:cpmEstimationCostFilters
		}).run().getRange(0,10);
	}



	function addValuesToLineItemFields(printRec,line_no,item_internalid,rate,price_level,units,quantity,amount,cost_est_type,est_extnd_cost){
		try{
			printRec.setSublistValue({
				sublistId:'item',
				fieldId:'item',
				value:item_internalid,
				line:line_no
			})

			printRec.setSublistValue({
				sublistId:'item',
				fieldId:'quantity',
				value:quantity,
				line:line_no
			});

			printRec.setSublistValue({
				sublistId:'item',
				fieldId:'price',
				value:price_level,
				line:line_no
			});


			printRec.setSublistValue({
				sublistId:'item',
				fieldId:'rate',
				value:rate,
				line:line_no
			});


			if(units){
				printRec.setSublistValue({
					sublistId:'item',
					fieldId:'units',
					value:units,
					line:line_no
				});
			}


			if(amount){
				printRec.setSublistValue({
					sublistId:'item',
					fieldId:'amount',
					value:round(amount,3), //newly added the function for round the amount
					line:line_no
				});
			}

			printRec.setSublistValue({
				sublistId:'item',
				fieldId:'costestimatetype',
				value:(est_extnd_cost)?'CUSTOM':cost_est_type,
				line:line_no
			});

			printRec.setSublistValue({
				sublistId : 'item',
				fieldId : 'custcoljobnbr',
				value : printRec.id,
				line:line_no
			});

			printRec.setSublistValue({
				sublistId:'item',
				fieldId:'costestimate',
				value:est_extnd_cost,
				line:line_no
			});

//			log.debug('item values'+line_no,"item id"+item_internalid+" rate="+rate+" price level ="+price_level+" units="+units+" quantity="+quantity+" amount="+amount+" cost_est_type = "+cost_est_type+" est_extnd_cost ="+est_extnd_cost);
		}catch(e){
			log.debug('error',e)
//			log.debug('item values'+line_no,"item id"+item_internalid+" rate="+rate+" price level ="+price_level+" units="+units+" quantity="+quantity+" amount="+amount+" cost_est_type = "+cost_est_type+" est_extnd_cost ="+est_extnd_cost);
		}

	}


	//Search the CPM-Estimation-BRC COST 
	function getBrcEstCostSearch(brcFilter){
		return search.create({
			type:'customrecord_cpm_estimation_brc',
			columns:['custrecord_cpm_brc_cost','custrecord_cpm_brc_unit'],
			filters:brcFilter
		}).run().getRange(0,10);
	}

	//creating the task record where values are not found or multiple value are found
	function createTaskRecord(title,message,assignTo,company,printJobId){
		var taskRec = record.create({
			type:record.Type.TASK,
			isDynamic:true
		});

		taskRec.setValue({
			fieldId:'title',
			value:title
		});

		taskRec.setValue({
			fieldId:'company',
			value:company
		});

		taskRec.setValue({
			fieldId:'transaction',
			value:printJobId
		});

		taskRec.setValue({
			fieldId:'message',
			value:message,
			ignoreFieldChange: true
		});

		taskRec.setValue({
			fieldId:'assigned',
			value:assignTo,
			ignoreFieldChange:true
		});

		taskRec.setValue({
			fieldId:'priority',
			value:'HIGH',
			ignoreFieldChange:true
		});

//		log.debug('task',title +' '+message);
		log.debug('task record id',taskRec.save());
	}

	//search for CPM ESTIMATION PAPER records 
	var version_effect_paper;
	function getCpmEstPaperRecords(printJob_estQty,format_id,vendorAward,printer_equip,recId,printJob_noof_version,perThousandId){
		var cpmEstPaperRecords = search.create({
			type:'customrecord_cpm_estimationpaper',
			columns:['internalid','custrecord_cpm_est_paper_size','custrecord_cpm_est_paper_amount','custrecord_cpm_est_paper_conby','custrecord_cpm_est_paper_conby.saleunit','custrecord_cpm_est_paper_conby.custitem_cpm_paper_version','custrecord_cpm_est_paper_defaltpaperitem'],
			filters:[['custrecord_cpm_est_paper_format','is',format_id],'and',
			         ['isinactive','is',false],'and',
			         ['custrecord_cpm_est_paper_vendor','is',vendorAward],'and',
			         ['custrecord_cpm_est_paper_equipment','is',printer_equip]
			]
		}).run(),cpmPaperAllowenceTotal = 0,consumed_by_item_type,paper_size,
		consumed_by_value,default_paperitem;

		cpmEstPaperRecords.each(function(cpmEstPaperRecord){
			log.debug('cpmEstPaperRecord',cpmEstPaperRecord)
			paper_allowence = parseFloat(cpmEstPaperRecord.getValue('custrecord_cpm_est_paper_amount'));

			consumed_by_item_type = cpmEstPaperRecord.getValue({name:'saleunit',join:'custrecord_cpm_est_paper_conby'});

			paper_size = cpmEstPaperRecord.getValue('custrecord_cpm_est_paper_size');

			consumed_by_value = cpmEstPaperRecord.getValue('custrecord_cpm_est_paper_conby');

			allowance_per = cpmEstPaperRecord.getValue('custrecord_cpm_est_paper_amount'); //Estimated Consumption
			
			default_paperitem = cpmEstPaperRecord.getValue('custrecord_cpm_est_paper_defaltpaperitem');

			version_effect_paper = cpmEstPaperRecord.getValue({
				name:'custitem_cpm_paper_version',
				join:'custrecord_cpm_est_paper_conby'
			});

			cpmPaperRec = record.create({
				type:'customrecord_cpm_paper_record',
				isDynamic: true
			});

			if(allowance_per != ''){
				cpmPaperRec.setValue({
					fieldId:'custrecord_cpm_paper_allowanceper',
					value:allowance_per
				});

				if(version_effect_paper){
					paper_allowence = paper_allowence * printJob_noof_version;
				}else if(consumed_by_item_type == perThousandId){  //if it is equal to per 1000
					paper_allowence = (printJob_estQty*paper_allowence)/1000;
				}
				
			}

			cpmPaperRec.setValue({
				fieldId:'custrecord_cpm_paper_printjob',
				value:recId,
				fireSlavingSync : true
			}).setValue({
				fieldId:'custrecord_cpm_paper_size',
				value:paper_size,
				fireSlavingSync : true
			}).setValue({
				fieldId:'custrecord_cpm_paper_allowance',
				value:Math.round(paper_allowence)
			}).setValue({
				fieldId:'custrecord_cpm_paper_consumedby',
				value:consumed_by_value,
				fireSlavingSync : true
			});
			
			//default paper item set to the newly created paper record
			if(default_paperitem != ''){
				cpmPaperRec.setValue({
					fieldId:'custrecord_cpm_paper_item',
					value:default_paperitem,
					fireSlavingSync : true
				})
			}

			cpmPaperAllowenceTotal += paper_allowence;
			log.debug('paper custom record id= ',cpmPaperRec.save({enableSourcing : false,ignoreMandatoryFields : false}));
			return true;
		})
		return cpmPaperAllowenceTotal;
	}



	function getItemPricingLevels(item_internalid,itemType,priceLevelType,eachId,perJobId,perThousandId){
		var pricelevel = 0,filterColumnPriceLevel;
		switch(priceLevelType){
		case eachId:
		case perJobId:
			pricelevel = 1;
			filterColumnPriceLevel = ['pricing.pricelevel','is',pricelevel]
			break;
		case perThousandId:
			pricelevel = 3;
			filterColumnPriceLevel = ['pricing.pricelevel','is',pricelevel]
			break;
		default:
			filterColumnPriceLevel = ['pricing.pricelevel','isnotempty',null]
		break;
		}

		return search.create({
			type:search.Type.ITEM,
			columns:['internalid','pricing.pricelevel','pricing.unitprice'],
			filters:[['internalid','is',item_internalid],'and',filterColumnPriceLevel]
		}).run().getRange(0,2);	   

	}

	
	//round the rate and cost values
	function round(value, precision) {
	    var multiplier = Math.pow(10, precision || 0);
	    return Math.round(value * multiplier) / multiplier;
	}

	return {
		getItemGroups : getItemGroups,
		getMemberItems : getMemberItems, 
		getCpmEstimation : getCpmEstimation,
		getcpmEstimationPrice : getcpmEstimationPrice,
		setValues	: addValuesToLineItemFields,
		getCpmEstimationCost : getCpmEstimationCost,
		getBrcEstCostSearch 	: getBrcEstCostSearch, 
		createTaskRecord : createTaskRecord, 
		getCpmEstPaperRecords : getCpmEstPaperRecords,
		getItemPricingLevels : getItemPricingLevels
	};

});
