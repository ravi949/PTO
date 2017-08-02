/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * Print Jon Record
 */

require.config({
  paths:{
    'printJobModule':'./cpm_search_module'
  }
});

define(['N/record','N/search','N/runtime','N/task','printJobModule'],

function(record,search,runtime,task,printJobModule) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
	var printRec,recId,memberItems,scriptObj,cpm_formatpagecount,printJob_noof_version,
	printJob_format,printJob_pageCount,printJob_pages,printJob_estQty,printJob_brcQty,printJob_entity,
	printJob_vendorAwrd,printJob_brcPrinter,printJob_equiment_value,printJob_main_estQty,printJob_number,
	assign_to,cpmEst_format_id,brcInsertItemCategory,brcItemId,eachId,perJobId,perThousandId;
    
	var printJobSearchLength;
	function processPrintJobRecords(scriptContext) {	
		var printJobSearch = search.create({
			 type:search.Type.OPPORTUNITY,
			 columns:['internalid'],
			 filters:[['custbody_cpm_automationstatus','is',6]]
		 }).run().getRange(0,1000);
		 
		 printJobSearchLength = printJobSearch.length;
		 scriptObj = runtime.getCurrentScript(),assign_to = scriptObj.getParameter({name:'custscript_cpm_task_error_assignto'}),
		 brcInsertItemCategory = scriptObj.getParameter({name:'custscript_cpm_brc_insert_item'}),
		 brcItemId = scriptObj.getParameter({name:'custscript_cpm_brc_item_id'}),
		 eachId = scriptObj.getParameter({name:'custscript_cpm_units_each_id'}),
		 perJobId = scriptObj.getParameter({name:'custscript_cpm_units_perjob_id'}),
		 perThousandId = scriptObj.getParameter({name:'custscript_cpm_units_per1000_id'});
	      
	     for(var col=0;col < printJobSearchLength;col++){
		     try{
		    	 recId = printJobSearch[col].getValue({name:'internalid'}),cpm_formatpagecount;

		    	 //loading the record PrintJob
		    	 printRec = record.load({
		    		 type:record.Type.OPPORTUNITY,
		    		 id:recId
		    	 });

		    	 //This is the PRINT JOB Record Field Values
		    	 printJob_format = printRec.getValue('custbody_cpm_printjob_format');
		    	 printJob_pageCount = printRec.getValue('custbody_cpm_printjob_pagecount');
		    	 printJob_pages  = printRec.getValue('custbodypages');
		    	 printJob_estQty = printJob_main_estQty = printRec.getValue('custbodyestqty'); 
		    	 printJob_brcQty = printRec.getValue('custbody_cpm_printjob_brcquantity'); 
		    	 printJob_entity = printRec.getValue('entity');
		    	 printJob_vendorAwrd = printRec.getValue('custbodyvndrawarder');
		    	 printJob_brcPrinter = printRec.getValue('custbody_cpm_printjob_brcprinter');
		    	 printJob_equiment_value = printRec.getValue('custbody_cpm_printjob_equipment');
		    	 printJob_number = printRec.getValue('tranid');
		    	 printJob_noof_version = printRec.getValue('custbody_cpm_printjob_versions');

		    	 cpm_formatpagecount = (printJob_pageCount != '') ? printJob_pageCount:printJob_pages;

		
				//these are the filters and columns for item groups search
				var cpmEstColumns = ['internalid','custrecord_cpm_estimation_ig'];
				var cpmEstFilters = [['custrecord_cpm_printjobformat','is',printJob_format],'and',['custrecord_cpm_formatpagecount','is',cpm_formatpagecount],'and',['isinactive','is',false]];
			//        var itemGroupResult = printJobModule.getItemGroups(itemGroupColumns,itemGroupFilters);
				var cpmEstResult = printJobModule.getCpmEstimation(cpmEstColumns,cpmEstFilters);
		
				var cpmEstResultLength = cpmEstResult.length;
		
				if(cpmEstResultLength>0){
					cpmEst_format_id = cpmEstResult[0].getValue('internalid');
					processTheMemberItems(cpmEstResult[0].getValue('custrecord_cpm_estimation_ig'));
				}else{
					printJobModule.createTaskRecord('CPM_ESTIMATION_REC_NOT_FOUND, Print Job: '+printJob_number,'No item groups returned for Print Job: '+printJob_number,assign_to,printJob_entity,recId);
					saveRecord(printRec,4);
				}	
		     }catch(e){
		    	  log.error('error print job id is '+recId,e.message);
		     }
	      }
    }
    
    
    //if item group search result has one result
    var item_name,spoilageFactor,markup,printJob_newQty,versionEffectQty,costRecNotFound,itemSaleUnit,itemPurchaseUnit,memberQty;
    function processTheMemberItems(item_group_id){
    	try{
	        var itemGroupColumns = ['internalid','memberitem.type','memberitem.internalid','memberitem.saleunit','memberitem','memberitem.custitem_cpm_customerpricing','memberitem.custitem_cpm_quantitypricing','memberitem.custitem_cpm_vendorcost','memberitem.custitem_cpm_volumecost','memberitem.custitem_cpm_itemcategory','memberitem.custitem_cpm_item_version','memberitem.purchaseunit','memberitem.custitem_cpm_quantitybuffer','memberitem.custitem_cpm_markup','memberquantity'];
	        var itemGroupFilters = [['internalid','is',item_group_id],'and',['memberitem.isinactive','is',false]];
	        memberItems = printJobModule.getMemberItems(itemGroupColumns,itemGroupFilters);
	         for(var i = 0; i<memberItems.length;i++){
	        	 
	        	 printJob_newQty = spoilageFactor = markup = undefined;
	        	 costRecNotFound = true;
	        	
	        	 var item_internalid = memberItems[i].getValue({
	        		 name:'internalid',
	        		 join:'memberitem'
	        	 });


	        	 item_type = memberItems[i].getValue({
	        		 name:'type',
	        		 join:'memberitem'
	        	 })

	        	 versionEffectQty = memberItems[i].getValue({
	        		 name:'custitem_cpm_item_version',
	        		 join:'memberitem'
	        	 });


	        	 itemSaleUnit = memberItems[i].getValue({
	        		 name:'saleunit',
	        		 join:'memberitem'
	        	 });

	        	 itemPurchaseUnit = memberItems[i].getValue({
	        		 name:'purchaseunit',
	        		 join:'memberitem'
	        	 });

    	          //newly added the member quantity
    	          itemQty = memberItems[i].getValue('memberquantity');

    	          item_name = memberItems[i].getText('memberitem');

    	          //Mfg : BRC internalid is 441 
    	          if(item_internalid != brcItemId){  // Brc item id
    	        	  processTheItems(i,item_internalid);
    	          }else{
    	        	  processTheBrcItem(i,item_internalid);
    	          }
	         }

	         var paperAllowenceTotal = getCpmEstPaperAmountTotal();

	         printRec.setValue({
	        	 fieldId:'custbodypaperallowance',
	        	 value:Math.round(paperAllowenceTotal)
	         });

	         saveRecord(printRec,2);
    	}catch(e){
    	   log.error('exception',e);//set automation value
    	   if(e.name != 'SSS_TIME_LIMIT_EXCEEDED'){
	    		printJobModule.createTaskRecord('Print Job Failed, Print Job: '+printJob_number,'Print Job: '+printJob_number+',Error:'+e.message,assign_to,printJob_entity,recId);
	    		printRec = record.load({type:record.Type.OPPORTUNITY,id:recId});
	    		saveRecord(printRec,4);
    	   }	
    	}
    }
    
    //saving the record.
    function saveRecord(printRec,automation_value){
    	printRec.setValue({
 			 fieldId:'custbody_cpm_automationstatus',
 		     value:automation_value
 	     });
		var id = printRec.save();
    }
    
    
    //processing the each and every memberitems
    var hasCustomerValue,volumePricing,hasVendorCost,hasVolumeCost,itemCategory,selVendor,
    cpmEstimationPriceResult,cpmEstPriceLength,cpmEstCostResult,cpmEstCostLength,
    price_level,rate,quantity,units,amount,cost_est_type,est_extnd_cost,cost_est_value;
    
    function  processTheItems(line_no,item_internalid){
    	  price_level = quantity = units = amount = cost_est_type = est_extnd_cost = cost_est_value = undefined;
    	  rate = 0;
    	  var cpmEstPriceLength = cpmEstimationCostLength = 0;
    	    //getting the price value from CPM-Estimation-Price custom record
    	    hasCustomerValue = memberItems[line_no].getValue({
    	      name:'custitem_cpm_customerpricing',
    	      join:'memberitem'
    	    });
    	    volumePricing = memberItems[line_no].getValue({
    	      name:'custitem_cpm_quantitypricing',
    	      join:'memberitem'
    	    });
    	    
    	    hasVendorCost = memberItems[line_no].getValue({
    	      name:'custitem_cpm_vendorcost',
    	      join:'memberitem'
    	    });
    	    
    	    hasVolumeCost = memberItems[line_no].getValue({
    	      name:'custitem_cpm_volumecost',
    	      join:'memberitem'
    	    });

    	    itemCategory = memberItems[line_no].getValue({
    	    	name:'custitem_cpm_itemcategory',
    	    	join:'memberitem'
    	    });
    	   
    	    //print job quantity is changed depends on item category. its not the printJob_estQty(not actual est qty)
    	    printJob_estQty = (itemCategory == brcInsertItemCategory)? printJob_brcQty:printJob_main_estQty;
    	   
    	    //getting the results from cost record
    	    if(hasVendorCost && hasVolumeCost == ''){
    	    	scenarioE(item_internalid,printJob_entity); //scenario E
    	    }else if(hasVendorCost == '' && hasVolumeCost == ''){
    	    	scenarioF(item_internalid,printJob_entity);	 //senario F
    	    }else if(hasVendorCost && hasVolumeCost){
    	    	scenarioG(item_internalid,printJob_entity);
    	    }else if(hasVendorCost == '' && hasVolumeCost){
    	    	scenarioH(item_internalid,printJob_entity);
    	    }
    	    
    	    //Has Customer Pricing  true & Volume Pricing false :- Scenario A
    	    if(hasCustomerValue && volumePricing == ''){
    	        scenarioA(item_internalid);
    	    }else if(hasCustomerValue && volumePricing){
    	    	//Has Customer Pricing & Volume Pricing are true :- Scenario B
    	    	scenarioB(item_internalid);
    	    }else if(hasCustomerValue == '' && volumePricing == ''){
    	    	//Has Customer Pricing  false & Volume Pricing false :- Scenario C
    	    	scenarioC(item_internalid);
    	    }else if(hasCustomerValue == '' && volumePricing){
    	    	//Has Customer Pricing  false & Volume Pricing true :- Scenario D
    	    	scenarioD(item_internalid);
    	    }

    	    if(item_internalid != brcItemId && versionEffectQty && itemSaleUnit == perJobId){ //per job
    	    	quantity = quantity * printJob_noof_version;
    	    	est_extnd_cost = est_extnd_cost * quantity;
    	    }

    	    
    	    log.debug('item values'+line_no,"item id"+item_internalid+" rate="+rate+" price level ="+price_level+" units="+units+" quantity="+quantity+" amount="+amount+" cost_est_type = "+cost_est_type+" est_extnd_cost ="+est_extnd_cost);
    	    printJobModule.setValues(printRec,line_no,item_internalid,rate,price_level,units,quantity,amount,cost_est_type,est_extnd_cost);
    	    
    }
    
    
    //creating the CPM Paper records types
    function getCpmEstPaperAmountTotal(){
    	return printJobModule.getCpmEstPaperRecords(printJob_main_estQty,cpmEst_format_id,printJob_vendorAwrd,printJob_equiment_value,recId,printJob_noof_version,perThousandId);
    }
    
    
    
    //Has Customer Pricing  true & Volume Pricing false :- Scenario A
    var priceUnitType;
    function scenarioA(item_internalid){
       	cpmEstimationPriceResult = getCpmEstPriceResult(['custrecord_cpm_est_price_customer','is',printJob_entity],item_internalid);
    	cpmEstPriceLength = cpmEstimationPriceResult.length;
        log.debug('scenario A '+item_internalid,cpmEstimationPriceResult);
    	if(cpmEstPriceLength > 0){
    		
    		if(cpmEstPriceLength > 1){
    			printJobModule.createTaskRecord('CPM_ESTPRICE_MULT, Print Job: '+printJob_number,'Multiple results returned for Item: '+item_name+' and customer '+printJob_entity+' on Print Job: '+printJob_number,assign_to,printJob_entity,recId);
    		}
    		
    		markup = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_cost_markup');
    		markup = markup !=''?parseFloat(markup.replace('%','')):0;
    		price_level = -1 //custom
    		rate = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_itemprice');
    		priceUnitType = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_unit');
    		if( markup <= 0 || costRecNotFound ){
    			switch(itemSaleUnit){
        		case eachId:
        			units = eachId;
        			break;
        		case perThousandId:
        			units = perThousandId;
        			amount = (quantity * rate) / 1000;
        			break;
        		case perJobId:
        			units = perJobId;
        			break;
        		}
    	    }else{
    	    	setPriceValues(itemSaleUnit);
    	    }	
    		
    	}else{
    		scenarioC(item_internalid);
    	}
    }
    
    //Has Customer Pricing & Volume Pricing are true :- Scenario B
    function scenarioB(item_internalid){
	    	cpmEstimationPriceResult = getCpmEstPriceResult(['custrecord_cpm_est_price_customer','is',printJob_entity],item_internalid);
	    	cpmEstPriceLength = cpmEstimationPriceResult.length;
		 log.debug('scenario B '+item_internalid,cpmEstimationPriceResult);
	    	if(cpmEstPriceLength > 0){
	    		
	    		if(cpmEstPriceLength >1){
	    			printJobModule.createTaskRecord('CPM_ESTPRICE_MULTVOL, Print Job: '+printJob_number,'Multiple volume price results returned for Item: '+item_name+' and customer '+printJob_entity+' on Print Job '+printJob_number,assign_to,printJob_entity,recId);
	    		}
	    		
	    		markup = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_cost_markup');
	    		markup = markup !=''?parseFloat(markup.replace('%','')):0;
	    		price_level = -1 //custom
	    		rate = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_itemprice');
	    		priceUnitType = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_unit');
	    		
	    		if( markup <= 0 || costRecNotFound ){
	    			switch(itemSaleUnit){
		    		case eachId:
		    			units = eachId;
		    			break;
		    		case perThousandId:
		    			units = perThousandId;
		    			amount = (quantity * rate) / 1000;
		    			break;
		    		default:
		    			units = itemSaleUnit;rate = 0;
		    		    printJobModule.createTaskRecord('CPM_ESTPRICE_UNIT, Print Job: '+printJob_number,'Unit (price per) not recognized for Item: '+item_name+' and customer '+printJob_entity+' on volume pricing custom record '+cpmEstimationPriceResult[0].getValue('internalid')+' for Print Job '+printJob_number,assign_to,printJob_entity,recId);  
		    			break;	
		    		}
	    		}else{
	    			setPriceValues(itemSaleUnit);
	    		}
	    		
	    	}else{
	    		scenarioD(item_internalid);
	    	}	
    }
    
    
    //Has Customer Pricing  false & Volume Pricing false :- Scenario C
    function scenarioC(item_internalid){
    		hasCustomerValue = volumePricing = false;
	    	cpmEstimationPriceResult = getCpmEstPriceResult(['custrecord_cpm_est_price_customer','is','@NONE@'],item_internalid); //changed isempty to @NONE@
	    	cpmEstPriceLength = cpmEstimationPriceResult.length;
                 log.debug('scenario C '+item_internalid,cpmEstimationPriceResult);
	    	if(cpmEstPriceLength>0){
	    		
	    		if(cpmEstPriceLength>1){
	    			printJobModule.createTaskRecord('CPM_ESTPRICE_MULTNCNV, Print Job: '+printJob_number,'Multiple non-customer, non-volume results returned for Item: '+item_name+' and on Print Job '+printJob_number,assign_to,printJob_entity,recId);
	    		}
	    		
	    		markup = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_cost_markup');
	    		markup = markup !=''?parseFloat(markup.replace('%','')):0;
	    		price_level = -1 //custom
	    		rate = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_itemprice');
	    		priceUnitType = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_unit');
	    		
	    		if( markup <= 0 || costRecNotFound ){
	    			
		    		switch(itemSaleUnit){
		    		case eachId:
		    			units =eachId;
		    			break;
		    		case perThousandId:
		    			units = perThousandId;
		    			amount = (quantity * rate) / 1000;
		    			break;
		    		case perJobId:
		    			units = perJobId;
		    			break;
		    		default:
		    			units = eachId; rate = 0;
		    			printJobModule.createTaskRecord('CPM_ESTPRICE_UNIT, Print Job: '+printJob_number,'Unit (price per) not recognized for Item: '+item_name+' and customer <customer> on volume pricing custom record '+cpmEstimationPriceResult[0].getValue('internalid')+' for Print Job '+printJob_number,assign_to,printJob_entity,recId);
		    			break;
		    		}
	    		}else{
	    			setPriceValues(itemSaleUnit);
	    		}
	    		
	    	}else{
	    		price_level = -1;rate = 0;
	    		printJobModule.createTaskRecord('CPM_ESTPRICE_ZERO, Print Job: '+printJob_number,'No prices for Item: '+item_name+' on Print Job '+printJob_number,assign_to,printJob_entity,recId);
	    	}
    }
    
    
    //Has Customer Pricing  false & Volume Pricing true :- Scenario D
    var pricingLevelCount;
    function scenarioD(item_internalid){
    	    hasCustomerValue = false;volumePricing = true;
	    	cpmEstimationPriceResult = getCpmEstPriceResult(['custrecord_cpm_est_price_customer','is','@NONE@'],item_internalid);
	    	cpmEstPriceLength = cpmEstimationPriceResult.length;
	    	log.debug('scenario D '+item_internalid,cpmEstimationPriceResult);
	    	if(cpmEstPriceLength>0){
	    		
	    		if(cpmEstPriceLength>1){
	    			printJobModule.createTaskRecord('CPM_ESTPRICE_MULTVOL, Print Job: '+printJob_number,'Multiple non-customer, volume pricing results returned for Item: '+item_name+' and on Print Job '+printJob_number,assign_to,printJob_entity,recId);
	    		}
	    		
	    		markup = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_cost_markup');
	    		markup = markup !=''?parseFloat(markup.replace('%','')):0;
	    		price_level = -1 //custom
	    		rate = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_itemprice');
	    		priceUnitType = cpmEstimationPriceResult[0].getValue('custrecord_cpm_est_price_unit');
	    		
	    		if( markup <= 0 || costRecNotFound ){
	    			switch(itemSaleUnit){
		    		case eachId:
		    			units = eachId;
		    			break;
		    		case perThousandId:
		    			units = perThousandId;
		    			amount = (quantity * rate) / 1000;
		    			break;
		    		case perJobId:
		    			units = perJobId;
		    			break;
		    		default:
		    			units = eachId;rate = 0;
		    		    printJobModule.createTaskRecord('CPM_ESTPRICE_UNIT, Print Job: '+printJob_number,'Unit (price per) not recognized for Item: '+item_name+' and customer '+printJob_entity+' on volume pricing custom record '+cpmEstimationPriceResult[0].getValue('internalid')+' for Print Job '+printJob_number,assign_to,printJob_entity,recId);
		    			break;
		    		}
	    		}else{
	    			setPriceValues(itemSaleUnit);
	    		}
	    	
	    	}else{
		    	
	    		var pricingResult = printJobModule.getItemPricingLevels(item_internalid,item_type,itemSaleUnit,eachId,perJobId,perThousandId);
	    		pricingLevelCount = pricingResult.length;
		    	
		    	if(pricingLevelCount>0){
		    		    rate = parseFloat(pricingResult[0].getValue({name:'unitprice',join:'pricing'}));
		    			switch(itemSaleUnit){
			    		case eachId:
			    			units = eachId;price_level = 1;
			    			break;
			    		case perThousandId:
			    			units = perThousandId;price_level = 3;
			    			amount = (quantity * rate) / 1000;
			    			break;
			    		case perJobId:
			    			units = perJobId;price_level = 1;
			    			break;
			    		default:
			    		    units = eachId;rate = 0,price_level = -1; 
	    			        printJobModule.createTaskRecord('CPM_ESTPRICE_UNIT, Print Job: '+printJob_number,'Sale Unit not recognized for Item: '+item_name+' for Print Job '+printJob_number+' on item record.',assign_to,printJob_entity,recId);		
	    			        break;
		    			}
		    	}else{
		    		scenarioC(item_internalid);
		    	}
	    	}
    }
    
    //These part is used to calculate the cost values
    //if Has Vendor Cost true & Has Volume Cost false
    function scenarioE(item_internalid,customer_value){
      filterColumn = (customer_value)?['custrecord_cpm_est_cost_customer','is',customer_value] : ['custrecord_cpm_est_cost_customer','is','@NONE@'];	
  	  cpmEstimationCostFilters = [
  	    ['custrecord_cpm_est_cost_item','is',item_internalid],'and',
  	    ['custrecord_cpm_est_cost_format','is',cpmEst_format_id],'and',
  	    ['custrecord_cpm_est_cost_forvolume','is',hasVolumeCost],'and',
  	    [[['custrecord_cpm_est_cost_qtyfloor','isempty',null],'and',
  	    ['custrecord_cpm_est_cost_qtycap','isempty',null]],'or',[
        ['custrecord_cpm_est_cost_qtyfloor','equalto',0],'and',
        ['custrecord_cpm_est_cost_qtycap','equalto',0]]],'and',
  	    filterColumn,'and', 
   	    ['isinactive','is',false],'and',
  	    ['custrecord_cpm_est_cost_vendor','is',printJob_vendorAwrd]
  	  ];
  	          	    	
  	  cpmEstCostResult = getCpmEstimationCostVendor();
  	  cpmEstCostLength = cpmEstCostResult.length; 
	   log.debug('scenario Cost E '+item_internalid,cpmEstCostResult);  	          	 
   	  
  	  if(cpmEstCostLength > 0){
  	      if(cpmEstCostLength>1){
  	    	  printJobModule.createTaskRecord('CPM_ESTCOST_VENDMULT, Print Job: '+printJob_number,'Multiple cost results returned for Item: '+item_name+' and vendor '+printJob_vendorAwrd+' on Print Job '+printJob_number,assign_to,printJob_entity,recId);
  	      }
  	    setCostAndEstValues(cpmEstCostResult);
  	  }else{
  		  if(customer_value){
  			scenarioE(item_internalid);
  		  }else{
  			scenarioF(item_internalid,printJob_entity);  
  		  }
  	  } 
  	  
    }
    
    
    //if Has Vendor Cost & Has Volume Cost false
    function scenarioF(item_internalid,customer_value){
    	 filterColumn = (customer_value)?['custrecord_cpm_est_cost_customer','is',customer_value] : ['custrecord_cpm_est_cost_customer','is','@NONE@'];
    	 cpmEstimationCostFilters = [
    	    ['custrecord_cpm_est_cost_forvolume','is',hasVolumeCost],'and',  
    	    ['custrecord_cpm_est_cost_item','is',item_internalid],'and',
    	    ['custrecord_cpm_est_cost_format','is',cpmEst_format_id],'and',
    	    ['isinactive','is',false],'and',
    	    filterColumn,'and',
    	    ['custrecord_cpm_est_cost_vendor','is',scriptObj.getParameter({name:'custscript_cpm_printer_or_vendor'})],'and',
    	    [[['custrecord_cpm_est_cost_qtyfloor','isempty',null],'and',
    	  	 ['custrecord_cpm_est_cost_qtycap','isempty',null]],'or',[
    	     ['custrecord_cpm_est_cost_qtyfloor','equalto',0],'and',
    	     ['custrecord_cpm_est_cost_qtycap','equalto',0]]
    	    ]
    	 ];
    	 
    	cpmEstCostResult = getCpmEstimationCostVendor();
    	cpmEstCostLength = cpmEstCostResult.length;
    	log.debug('scenario Cost F '+item_internalid,cpmEstCostResult);  

    	if(cpmEstCostLength > 0){
    	   if(cpmEstCostLength>1){	    			 
    		   printJobModule.createTaskRecord('CPM_ESTCOST_NOVENDMULT, Print Job: '+printJob_number,'Multiple cost results returned for Item: '+item_name+' and vendor '+printJob_vendorAwrd+' on Print Job '+printJob_number,assign_to,printJob_entity,recId); 
    	   }
    	   setCostAndEstValues(cpmEstCostResult);
    	}else{
    		if(customer_value){
    			scenarioF(item_internalid,false);
    		}else{
        		quantity = (itemSaleUnit == perJobId)?itemQty:printJob_estQty; //equal to per job and itemQty(replace for 1)
        		cost_est_type = 'CUSTOM'; 
        		est_extnd_cost = cost_est_value = 0;
    		}
    	}
    }
    
    //if Has Vendor Cost & Has Volume Cost are true
    function scenarioG(item_internalid,customer_value){
    	filterColumn = (customer_value)?['custrecord_cpm_est_cost_customer','is',customer_value] : ['custrecord_cpm_est_cost_customer','is','@NONE@'];
    	cpmEstimationCostFilters = [
    	   ['custrecord_cpm_est_cost_forvolume','is',hasVolumeCost],'and',  
    	   ['custrecord_cpm_est_cost_item','is',item_internalid],'and',
    	   ['custrecord_cpm_est_cost_format','is',cpmEst_format_id],'and',
    	   ['isinactive','is',false],'and',
    	   filterColumn,'and',
    	   ['custrecord_cpm_est_cost_vendor','is',printJob_vendorAwrd],'and', //vendor changed parameter to vendor awrded
    	   ['custrecord_cpm_est_cost_qtyfloor','isnotempty',null],'and',
    	   ['custrecord_cpm_est_cost_qtycap','isnotempty',null],'and',
    	   ['custrecord_cpm_est_cost_qtyfloor','lessthanorequalto',printJob_estQty],'and',
    	   ['custrecord_cpm_est_cost_qtycap','greaterthanorequalto',printJob_estQty]
    	   ];
    	
    	cpmEstCostResult = getCpmEstimationCostVendor();
    	cpmEstCostLength = cpmEstCostResult.length;
    	log.debug('scenario Cost G '+item_internalid,cpmEstCostResult);  

    	if(cpmEstCostLength > 0){
    		if(cpmEstCostLength>1){
    			printJobModule.createTaskRecord('CPM_ESTCOST_VENDMULT, Print Job: '+printJob_number,'Multiple cost results returned for Item: '+item_name+' and vendor '+printJob_vendorAwrd+' on Print Job '+printJob_number,assign_to,printJob_entity,recId);
    		}
    		setCostAndEstValues(cpmEstCostResult);
    	}else{
    		if(customer_value)
    			scenarioG(item_internalid,false);
    		else
    			scenarioH(item_internalid,printJob_entity);
    	} 
    }
    
    //if Has Vendor Cost is false & Has Volume Cost is true
    function scenarioH(item_internalid,customer_value){
    	filterColumn = (customer_value)?['custrecord_cpm_est_cost_customer','is',customer_value] : ['custrecord_cpm_est_cost_customer','is','@NONE@'];
    	cpmEstimationCostFilters = [
    	      ['custrecord_cpm_est_cost_forvolume','is',hasVolumeCost],'and',  
    	      ['custrecord_cpm_est_cost_item','is',item_internalid],'and',
    	      ['custrecord_cpm_est_cost_format','is',cpmEst_format_id],'and',
    	      ['custrecord_cpm_est_cost_vendor','is',scriptObj.getParameter({name:'custscript_cpm_printer_or_vendor'})],'and', //set the vendor null to parameter vendor
    	      ['isinactive','is',false],'and',
    	      filterColumn,'and',
    	      ['custrecord_cpm_est_cost_qtyfloor','isnotempty',null],'and',
    	      ['custrecord_cpm_est_cost_qtycap','isnotempty',null],'and',
    	      ['custrecord_cpm_est_cost_qtyfloor','lessthanorequalto',printJob_estQty],'and',
    	      ['custrecord_cpm_est_cost_qtycap','greaterthanorequalto',printJob_estQty]
    	 ];
    	
    	cpmEstCostResult = getCpmEstimationCostVendor();
    	cpmEstCostLength = cpmEstCostResult.length;
    	log.debug('scenario Cost H '+item_internalid,cpmEstCostResult);
  
    	if(cpmEstCostLength > 0){
    		if(cpmEstCostLength>1){
    			printJobModule.createTaskRecord('CPM_ESTCOST_NOVENDMULT, Print Job: '+printJob_number,'Multiple cost results returned for Item: '+item_name+' and vendor '+printJob_vendorAwrd+' on Print Job '+printJob_number,assign_to,printJob_entity,recId);
    		}
    		setCostAndEstValues(cpmEstCostResult);
    	}else{
    		if(customer_value){
    			scenarioH(item_internalid,false);
    		}else{
        		quantity = (itemSaleUnit == perJobId)?itemQty:printJob_estQty; // equal to per job
        		cost_est_type = 'CUSTOM'; 
        		est_extnd_cost = cost_est_value = 0;
    		}
    	}
    }
    
    //has vendor and volume set value
    function setCostAndEstValues(cpmEstCostResult){
    	 cost_est_type = 'CUSTOM';
    	 spoilageFactor = cpmEstCostResult[0].getValue('custrecord_cpm_est_cost_spoilagefactor');
    	 cost_est_value = cpmEstCostResult[0].getValue('custrecord_cpm_est_cost_itemcost');
   	     var costRecordUnitType = cpmEstCostResult[0].getValue('custrecord_cpm_est_cost_unit');
   	     
   	     spoilageFactor = spoilageFactor !=''?parseFloat(spoilageFactor.replace('%','')):0;
   	     costRecNotFound = false;
   	  
   	     if(spoilageFactor <= 0){
    		 
       	     switch(itemPurchaseUnit){
       	     case eachId:
       	    	quantity = printJob_estQty;
       	    	est_extnd_cost = printJob_estQty * cost_est_value;
       	    	 break;
       	     case perThousandId:
       	    	quantity = printJob_estQty;
       	    	est_extnd_cost = (printJob_estQty * cost_est_value)/1000;
       	    	 break;
       	     case perJobId:
       	    	quantity = itemQty;
       	    	est_extnd_cost = cost_est_value;
       	    	 break;
       	     }     
    	 }else{
    		 printJob_newQty = (1+(spoilageFactor/100))*printJob_estQty;
    		 switch(itemPurchaseUnit){
       	     case eachId:
       	    	quantity = printJob_newQty; 
       	    	est_extnd_cost = cost_est_value =  printJob_newQty * cost_est_value;
       	    	 break;
       	     case perThousandId:
       	    	quantity = printJob_newQty; 
       	    	est_extnd_cost = cost_est_value =  (printJob_newQty * cost_est_value)/1000;
       	    	 break;
       	     case perJobId:
       	    	 quantity = printJob_newQty = itemQty;
       	    	 est_extnd_cost = cost_est_value;
       	    	 break;
       	     }   
    	 }
//   	  log.debug('quaintity',"rate = "+rate+","+"amount = "+amount+" quantity = "+quantity);
    }  
    
    //process the BRC ITEM
    var brcCostFilters;
    function processTheBrcItem(line_no,item_internalid){
    	cost_est_type  = cost_est_value = quantity = undefined;
    	if(printJob_brcQty == '' || printJob_brcQty == 0){
    		quantity = rate = est_extnd_cost = 0;price_level=-1,cost_est_type  = 'CUSTOM',cost_est_value = 0;	
    	}else{
    		
    		var brcBuffer = memberItems[line_no].getValue({name:'custitem_cpm_quantitybuffer',join:'memberitem'});
    		markup = memberItems[line_no].getValue({name:'custitem_cpm_markup',join:'memberitem'});
    		markup = (markup !=null && markup !='')?parseFloat(markup):0; //changed markup 0 to 1.3 
    		markup = (1+(markup/100));
    		brcBuffer = (brcBuffer !=''&& brcBuffer !=null)?parseFloat(brcBuffer):0;  //changed brc buffer 0 to 3 
    		brcBuffer =  (1+(brcBuffer/100));
    		quantity = printJob_brcQty * brcBuffer;   //becomes 1.03 		 
    		//quantity = printJob_brcQty * 1.03;
    		brcCostFilters =[
    		  ['custrecord_cpm_brc_vendor','is',scriptObj.getParameter({name:'custscript_cpm_brc_vendor'})],'and',
    		  ['custrecord_cpm_brc_volumepricing','is',true],'and',
    		  ['custrecord_cpm_brc_qtyfloor','lessthanorequalto',quantity],'and',
    		  ['custrecord_cpm_brc_qtycap','greaterthanorequalto',quantity],'and',
    		  ['isinactive','is',false],'and',
    		  ['custrecord_cpm_brc_item','is',item_internalid]
    		]
    		
    		var brcResult = printJobModule.getBrcEstCostSearch(brcCostFilters);
    		log.debug('result brc',brcResult);
    		if(brcResult.length>0){
    			var brc_cost = brcResult[0].getValue('custrecord_cpm_brc_cost');
    			var unitType = brcResult[0].getValue('custrecord_cpm_brc_unit');

    			//cost calculation
    			switch(itemPurchaseUnit){
    			case eachId:
    				est_extnd_cost = quantity * brc_cost;
    				break;
    			case perThousandId:
    				est_extnd_cost = (quantity * brc_cost)/1000;
    				break;
    			default:
    				est_extnd_cost = 0;
    			break;
    			}

    			//price calculation
    			if(itemSaleUnit == eachId || itemSaleUnit == perThousandId){  //equal to each and per 1000
    				price_level = -1,units = itemSaleUnit,rate = brc_cost*(markup);
    				amount = (itemSaleUnit == perThousandId)?(quantity * brc_cost*markup) / 1000:undefined; // equal to per 1000
    			}else{
    				price_level = -1,units = eachId,rate = 0;
    			}

    		}else{
    			rate = est_extnd_cost = 0;price_level=-1,cost_est_type  = 'CUSTOM',cost_est_value = 0;
    		}
    	}
       printJobModule.setValues(printRec,line_no,item_internalid,rate,price_level,units,quantity,amount,cost_est_type,est_extnd_cost);
    	 
    }
    
    
    //setting the price values if markup have the value more than 0
    function setPriceValues(unitType){
    	var calValue = (1+(markup/100))*cost_est_value;
    	switch(unitType){
    	case eachId:
    		units = eachId,rate = calValue;
    		break;
    	case perThousandId:
    		units = perThousandId,rate = calValue,
    		amount =(quantity*calValue) / 1000;
    		break;
    	case perJobId:
    		units = perJobId,rate = calValue;
    		break;
    	default:
    		units = eachId, rate = 0;
    	break;
    	} 
    }
    
    
    //getting the CPM-Estimation-Price Result from printJobModule for hasCustomerValue and volumePricing
    function getCpmEstPriceResult(filterColumn,item_id){
      
      var internalidColumn = search.createColumn({
    	    name: 'internalid',
    	    sort: search.Sort.ASC
      });
      
     if((hasCustomerValue == '' && volumePricing == '') || (hasCustomerValue && volumePricing == '')){
	  log.debug('itemID '+item_id, hasCustomerValue)
    	  cpmEstimationPriceFilters = [
    	   ['custrecord_cpm_est_price_forcustomer','is',hasCustomerValue],'and',
    	   filterColumn,'and',
    	   ['isinactive','is',false],'and',
    	   ['custrecord_cpm_est_price_item','is',item_id],'and',
    	   ['custrecord_cpm_est_price_format','is',cpmEst_format_id],'and',
    	   ['custrecord_cpm_est_price_printer','is',printJob_vendorAwrd],'and',
    	   ['custrecord_cpm_est_price_forvolume','is',volumePricing],'and',
    	   [[['custrecord_cpm_est_price_qtyfloor','isempty',null],'and',
     	     ['custrecord_cpm_est_price_qtycap','isempty',null]],'or',
     	    [['custrecord_cpm_est_price_qtyfloor','equalto',0],'and',
     	     ['custrecord_cpm_est_price_qtycap','equalto',0]]
     	   ]
    	];
    	  
      }else{
    	  cpmEstimationPriceFilters = [
    	    ['custrecord_cpm_est_price_forcustomer','is',hasCustomerValue],'and',
    	    filterColumn,'and',
    	    ['isinactive','is',false],'and',
    	    ['custrecord_cpm_est_price_item','is',item_id],'and',
    	    ['custrecord_cpm_est_price_format','is',cpmEst_format_id],'and',
    	    ['custrecord_cpm_est_price_printer','is',printJob_vendorAwrd],'and',
    	    ['custrecord_cpm_est_price_forvolume','is',volumePricing],'and',
    	    ['custrecord_cpm_est_price_qtyfloor','isnotempty',null],'and',
    	    ['custrecord_cpm_est_price_qtycap','isnotempty',null],'and',
    	    ['custrecord_cpm_est_price_qtyfloor','lessthanorequalto',quantity],'and',
    	    ['custrecord_cpm_est_price_qtycap','greaterthanorequalto',quantity]
    	];
      }
      
      cpmEstimationPriceColumn = [internalidColumn,'custrecord_cpm_est_price_itemprice','custrecord_cpm_est_price_unit','custrecord_cpm_est_cost_markup']

      return printJobModule.getcpmEstimationPrice(cpmEstimationPriceColumn,cpmEstimationPriceFilters);

    }
    
    
    //has vendor and has volume
    function getCpmEstimationCostVendor(){
    	 var internalidColumn = search.createColumn({
     	    name: 'internalid',
     	    sort: search.Sort.ASC
     	});
        cpmEstimationCostColumns = [internalidColumn,'custrecord_cpm_est_cost_itemcost','custrecord_cpm_est_cost_unit','custrecord_cpm_est_cost_vendor','custrecord_cpm_est_cost_spoilagefactor'];
        return printJobModule.getCpmEstimationCost(cpmEstimationCostColumns,cpmEstimationCostFilters,'Has Vendor is true');
    }
    

    return {
        execute: processPrintJobRecords
    };

});
