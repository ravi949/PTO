/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * It is render the Print Job Record in view mode.
 */
define(['N/record', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {serverWidget} serverWidget
 */
function(record, serverWidget) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	var request = context.request,response = context.response,params = request.parameters;
    	if(request.method == 'GET'){
    		
    		try{
    			var promotionRec = record.load({
        			type:record.Type.OPPORTUNITY,
        			id:params.pjid
        		}),
        		form = serverWidget.createForm({
        			title:'Print Job # '+promotionRec.getValue('tranid')
        		});
        		
        		form.addFieldGroup({
        			id : 'cpm_primaryinfo',
        			label : 'Primary Information'
        		});
        		
        		form.addFieldGroup({
        			id : 'cpm_impdates',
        			label : 'Important Dates'
        		});
        		
        		form.addField({
        			id:'custpage_cpm_jobnumber',
        			label:'Job Number',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getValue('tranid');
        		
        		form.addField({
        			id:'custpage_cpm_title',
        			label:'Title / Description',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getValue('custbody18');
        		
        		form.addField({
        			id:'custpage_project',
        			label:'Project #',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getValue('custbody12');
        		
        		form.addField({
        			id:'cpm_estquantity',
        			label:'Estimated Quantity',
        			type:serverWidget.FieldType.INTEGER,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getValue('custbodyestqty');
        		
        		form.addField({
        			id:'cpm_format',
        			label:'Format',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).updateBreakType({
        		    breakType : serverWidget.FieldBreakType.STARTCOL
        		}).defaultValue = promotionRec.getText('custbody_cpm_printjob_format');
        		
        		form.addField({
        			id:'cpm_pagecount',
        			label:'Page Count',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbody_cpm_printjob_pagecount');
        		
        		form.addField({
        			id:'cpm_brcquantity',
        			label:'BRC Quantity',
        			type:serverWidget.FieldType.INTEGER,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getValue('custbody_cpm_printjob_brcquantity');
        		
        		var jobSpecs = form.addField({
        			id:'cpm_jobspecs',
        			label:'Job Specs',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_primaryinfo'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).updateBreakType({
        		    breakType : serverWidget.FieldBreakType.STARTCOL
        		});
        		jobSpecs.maxLength = 500;
        		jobSpecs.defaultValue = promotionRec.getValue('memo');
        		
        		
        		//Date fields
        		form.addField({
        			id:'cpm_files_duedate',
        			label:'Files Due Date',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_impdates'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbodydtefiles');
        		
        		form.addField({
        			id:'cpm_binddate',
        			label:'Bind Date',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_impdates'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbodydtebind');
        		
        		form.addField({
        			id:'cpm_inhome_date',
        			label:'In-home Date',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_impdates'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbodydteiinhome');
        		
        		form.addField({
        			id:'cpm_proof_deadline',
        			label:'Proof Deadline',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_impdates'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbodydteproof');
        		
        		form.addField({
        			id:'cpm_printdate',
        			label:'Print Date',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_impdates'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbodydteprint');
        		
        		form.addField({
        			id:'cpm_shipdate1',
        			label:'Ship Date 1',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_impdates'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbodydteship1');
        		
        		form.addField({
        			id:'cpm_shipdate2',
        			label:'Ship Date 2',
        			type:serverWidget.FieldType.TEXT,
        			container:'cpm_impdates'
        		}).updateDisplayType({
        			displayType : serverWidget.FieldDisplayType.INLINE
        		}).defaultValue = promotionRec.getText('custbodydteship2');
        		
        		response.writePage(form);
    		}catch(e){
    			throw Error(e.message);
    		}
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
