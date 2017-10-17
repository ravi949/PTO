/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 
		'N/ui/serverWidget',
		'N/url'],
/**
 * @param {https} https
 * @param {serverWidget} serverWidget
 */
function(https, serverWidget, url) {
   
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
    		var actions = {
    			'GET':getMethod
    		}
    		
    		actions[context.request.method](context);
    	
    	}catch(e){
    		log.error(e.name,e.message);
    	}
    }
    
    function getMethod(context){
    	log.debug('context.parameters',context.parameters);
    	if(!context.request.parameters.token){
    		var suiteletURL = url.resolveScript({
				scriptId: 'customscript_cpm_signnow_trandocstatusli',
			    deploymentId: 'customdeploy_cpm_signnow_trandocstatusli',
			    returnExternalUrl: false
			});
    		context.response.write("<html><script>window.location.href = 'https://integrations.cudasign.com/shared/#/redirect?redirect_uri='+encodeURIComponent(window.location.origin+'"+suiteletURL+"')</script></html>");
    		return
    	}
    	
    	
    	var form = serverWidget.createForm({
    	    title : 'Signnow Documents'
    	});
    	
//    	var tranBodyField = form.addField({
//    		label:'Select Transaction',
//    		id:'custpage_cpm_tranlist',
//    		type:serverWidget.FieldType.SELECT,
//    		source:'transaction'
//    	});
    	
    	form.addSubtab({
    	    id : 'custpage_cpm_docstatuslist',
    	    label : 'Documents List'
    	});
    	
    	var sublist = form.addSublist({
    	    id : 'custpage_cpm_sublistdocstatus',
    	    type : serverWidget.SublistType.LIST,
    	    label : 'Inline Editor Sublist',
    	    tab:'custpage_cpm_docstatuslist'
    	});
    	
    	sublist.addField({
    	    id : 'custpage_cpm_tranid',
    	    type : serverWidget.FieldType.SELECT,
    	    label : 'Transaction ID',
    	    source:'transaction'
    	}).updateDisplayType({
    	    displayType : serverWidget.FieldDisplayType.INLINE
    	});
    	sublist.addField({
    	    id : 'custpage_cpm_docname',
    	    type : serverWidget.FieldType.TEXT,
    	    label : 'Document Name'
    	});
    	sublist.addField({
    	    id : 'custpage_cpm_docstatus',
    	    type : serverWidget.FieldType.TEXT,
    	    label : 'Document Status'
    	});
    	
    	var responseObj = getDocuments(context.request.parameters);
    	var i = 0;
    	
    	if(responseObj.code != 200){
    		context.response.write('Invalid token, Please login again.');
    	}
    	
    	responseObj.list.forEach(function(e){
    		sublist.setSublistValue({
    		    id : 'custpage_cpm_tranid',
    		    line : i,
    		    value : e.recordid
    		});
    		sublist.setSublistValue({
    		    id : 'custpage_cpm_docname',
    		    line : i,
    		    value : e.docname
    		});
    		sublist.setSublistValue({
    		    id : 'custpage_cpm_docstatus',
    		    line : i,
    		    value : e.status
    		});
    		i++;
    	});
    	
    	
//    	form.clientScriptModulePath = './CPM_Signnow_TranDocStatus_cs_script.js';
    	context.response.writePage(form);
    }
    
    function getDocuments(params){
    	var docsList = [];
    	var a = https.get('https://integrations.signnow.com/signnow/api/user/documentsv2',{
    		'Content-Type':'application/json',
    		'Authorization':'Bearer '+params.token
    	});

    	if(a.code == 200){
    		var list = JSON.parse(a.body);
    		docsList = list.map(function(e){ 
    			if(e.field_invites.length > 0){
    				return {
    					docname:e.document_name,
    					recordid:e.integrations[0].data['record_id'],
    					status:e.field_invites[0].status
    				} 
    			}
    		}).filter(function(e){
    			if(e != null){
    				return e
    			} 
    		});
    	}
    	return {code:a.code,list:docsList};
    }
    
    return {
        onRequest: onRequest
    };
    
});
