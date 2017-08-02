/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/redirect','N/record','N/runtime'],
/**
 * @param {redirect} redirect
 */
function(redirect,record,runtime) {

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @Since 2016.1
	 */
	function onAction(scriptContext) {
		try{
			var quRec = scriptContext.newRecord,
			pjid = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_pjid'}),
			pjRec = record.load({
				type:record.Type.OPPORTUNITY,
				id:pjid
			});

			pjRec.setValue({
				fieldId:'custbody18',
				value:quRec.getValue('custbody18')
			}).setValue({
				fieldId:'entity',
				value:quRec.getValue('entity')
			}).setValue({
				fieldId:'custbodyvndrawarder',
				value:quRec.getValue('custbodyvndrawarder')
			}).setValue({
				fieldId:'custbody_cpm_printjob_format',
				value:quRec.getValue('custbody_cpm_printjob_format')
			}).setValue({
				fieldId:'custbody_cpm_printjob_pagecount',
				value:quRec.getValue('custbody_cpm_printjob_pagecount')
			}).setValue({
				fieldId:'custbodyestqty',
				value:quRec.getValue('custbodyestqty')
			}).setValue({
				fieldId:'custbody_cpm_printjob_brcquantity',
				value:quRec.getValue('custbody_cpm_printjob_brcquantity')
			}).setValue({
				fieldId:'department',
				value:quRec.getValue('department')
			}).setValue({
				fieldId:'class',
				value:quRec.getValue('class')
			}).setValue({
				fieldId:'location',
				value:quRec.getValue('location')
			}).setValue({
				fieldId:'memo',
				value:quRec.getValue('custbody1')
			});
			
			var quItemCount = quRec.getLineCount('item'),pjItemCount = pjRec.getLineCount('item');
			
			//removing the line item from the print job
			for(var i = pjItemCount-1;i >= 0 ;i--){
				pjRec.removeLine({
					 sublistId: 'item',
					 line: i,
					 ignoreRecalc: true
				})
			}
			
			for(var i = 0;i < quItemCount;i++){
				pjRec.setSublistValue({
					 sublistId: 'item',
					 fieldId:'item',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'item',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'custcol_cpm_pj_include',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'custcol_cpm_pj_include',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'quantity',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'quantity',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'units',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'units',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'price',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'price',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'rate',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'rate',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'amount',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'amount',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'costestimatetype',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'costestimatetype',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'costestimate',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'costestimate',line:i}),
					 line: i
				}).setSublistValue({
					 sublistId: 'item',
					 fieldId:'custcolvendorselection',
					 value:quRec.getSublistValue({sublistId:'item',fieldId:'custcolvendorselection',line:i}),
					 line: i
				})
			}
			
			log.debug('remaining usage',runtime.getCurrentScript().getRemainingUsage())
			//redirect the user to print job record after update
			redirect.toRecord({
				type : record.Type.OPPORTUNITY, 
				id : pjRec.save({
					enableSourcing:false,
					ignoreMandatoryFields:true
				})
			});
		}catch(e){
			log.debug('exception in redirect to pj',e)
		}
	}

	return {
		onAction : onAction
	};

});
