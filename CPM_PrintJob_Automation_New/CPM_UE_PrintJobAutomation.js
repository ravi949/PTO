/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Requires script parameters - 
 * Suitelet ID - 'custscript_cpm_pjasuitelet1'
 * Deployment ID - 'custscript_cpm_pjadeployment1'
 * Recalc File ID - 'custscript_recalc_fileid'
 * 
 */
define(['N/runtime',
		'N/redirect',
		'N/ui/serverWidget'
		],

function(runtime, redirect, serverWidget) {
  
   /**
     * Function definition to be triggered before record is saved.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {string} sc.type - Trigger type
     * @Since 2015.2
     */
   function beforeLoad(sc){
	   try{
		   var printJob = sc.newRecord;
		   if(sc.type == sc.UserEventType.COPY){
			   printJob.setValue({
				   fieldId : 'custbody_cpm_automationstatus',
				   value : ''
			   });

			   printJob.setValue({
				   fieldId:'custbodypaperallowance',
				   value:'0'
			   });

			   var lineCount = printJob.getLineCount('item');
			   for(var i=lineCount-1;i>=0;i--){
				   printJob.removeLine({
					   sublistId:'item',
					   line:i,
					   ignoreRecalc: true
				   });
			   }
		   }  
		   
		   //adding the Recalculate button on print job record in view mode.
		   if(sc.type == sc.UserEventType.VIEW){
			   var autoStatus = printJob.getValue('custbody_cpm_automationstatus');
			   var pjStatus = printJob.getValue('status');
			   
			   if(autoStatus == 2 || autoStatus == 3 || autoStatus == 4){
				   if(pjStatus != 'Closed - Won'){
					   sc.form.addButton({
						    id : 'custpage_cpm_recalbtn',
						    label : 'Recalculate',
						    functionName:'redirecToRecal('+printJob.id+')'
					   });
					   sc.form.clientScriptModulePath = './CPM_CS_PrintJobClientMethods.js'; 
				   }
			   }
		   }
		   
	   } catch (ex) {
		   log.error(ex.name, ex.message);
		   return false;
	}    
   }
  
  /**
     * Function definition to be triggered before record is saved.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {Record} sc.oldRecord - Old record
     * @param {string} sc.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(sc) {
    	try{
    		var ec = runtime.executionContext;
    		if (ec == runtime.ContextType.SUITELET) return;
    		var oldPrintJob = sc.oldRecord, printJob = sc.newRecord;
    		if (sc.type == sc.UserEventType.EDIT){
    			var oldCompany = oldPrintJob.getValue({fieldId:'entity'}),
    			company = printJob.getValue({fieldId:'entity'}),
    			oldVendor = oldPrintJob.getValue({fieldId:'custbodyvndrawarder'}),
    			vendor = printJob.getValue({fieldId:'custbodyvndrawarder'}),
    			oldFormat = oldPrintJob.getValue({fieldId:'custbody_cpm_printjob_format'}),
    			format = printJob.getValue({fieldId:'custbody_cpm_printjob_format'}),
    			oldPageCount = oldPrintJob.getValue({fieldId:'custbody_cpm_printjob_pagecount'}),
    			pageCount = printJob.getValue({fieldId:'custbody_cpm_printjob_pagecount'}),
    			oldPages = oldPrintJob.getValue({fieldId:'custbodypages'}),
    			pages = printJob.getValue({fieldId:'custbodypages'}),
    			oldQty = oldPrintJob.getValue({fieldId:'custbodyestqty'}),
    			qty = printJob.getValue({fieldId:'custbodyestqty'}),
    			oldqtyBRC = oldPrintJob.getValue({fieldId:'custbody_cpm_printjob_brcquantity'}),
    			qtyBRC = printJob.getValue({fieldId:'custbody_cpm_printjob_brcquantity'}),
    			oldVersions = oldPrintJob.getValue({fieldId:'custbody_cpm_printjob_versions'}),
    			versions = printJob.getValue({fieldId:'custbody_cpm_printjob_versions'}),
    			oldEquipment = oldPrintJob.getValue({fieldId:'custbody_cpm_printjob_equipment'}),
    			equipment = printJob.getValue({fieldId:'custbody_cpm_printjob_equipment'}),
    			flag = false;

    			if (company != oldCompany){
    				flag = true;
    			} else if (vendor != oldVendor){
    				flag = true;
    			} else if (format != oldFormat){
    				flag = true;
    			} else if (pageCount != oldPageCount){
    				flag = true;
    			} else if (pages != oldPages){
    				flag = true;
    			} else if (qty != oldQty){
    				flag = true;
    			} else if (qtyBRC != oldqtyBRC){
    				flag = true;
    			} else if (versions != oldVersions){
    				flag = true;
    			} else if (equipment != oldEquipment){
    				flag = true;
    			}
    			
    			flag = (format != '' && pageCount != '');
    			
    			if (flag){
    				printJob.setValue({
    					fieldId : 'custbody_cpm_automationstatus',
    					value : '1'
    				});
    			}
    		}
		} catch (ex) {
			log.error(ex.name, ex.message);
			return false;
		}
    }
    
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {Record} sc.oldRecord - Old record
     * @param {string} sc.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(sc) {
    	try{
    		var ec = runtime.executionContext;
    		if (ec == runtime.ContextType.SUITELET) return;

    		if (sc.type == sc.UserEventType.CREATE || sc.type == sc.UserEventType.EDIT || sc.type == sc.UserEventType.COPY){
    			var printJob = sc.newRecord,
    			format = printJob.getValue({fieldId:'custbody_cpm_printjob_format'}),
    			pageCount = printJob.getValue({fieldId:'custbody_cpm_printjob_pagecount'}),
    			doNotEstimate = printJob.getValue({fieldId:'custbody_cpm_donotestimate'});
    			
    			var automationStatus = printJob.getValue({fieldId:'custbody_cpm_automationstatus'});
    			if (sc.type == sc.UserEventType.COPY) {
    				printJob.setValue({fieldId:'custbody_cpm_automationstatus', value:'1'});
    				printJob.save();
    			}
    			if(automationStatus != '2' && automationStatus != '3' && !doNotEstimate){
    				log.debug('custbody_cpm_printjob_format',format);
    				log.debug('pageCount',pageCount);
    				if(format != '' && pageCount != '' ){
    					redirect.toSuitelet({
        					scriptId : runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_automationscriptid1'}),
        					deploymentId : runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_automationdeplymntid1'}),
        					parameters : {
        						'pjid' : printJob.id
        					}
        				});
    				} else {
    					log.error('','There is no Format or Page Count on this Print Job (Internal Id: '+printJob.id+')');
    				}    				
    			}
    		}
		} catch (ex) {
			log.error(ex.name, ex.message);
			return false;
		}
    }

    return {
        beforeLoad:beforeLoad,
    	beforeSubmit : beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
