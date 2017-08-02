/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/render', 'N/config','N/runtime' ,'N/file','N/record'],
/**
 * @param {record} file
 * @param {render} render
 * @param {search} search
 */
function( render, config ,runtime ,file ,record) {
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
			/******* loading the HTML template(CPM_PrintJob_PDF_Layout_HTML.html)  *******/
    		var templateFile = file.load({
    			id: runtime.getCurrentScript().getParameter({name: 'custscript_cpm_printjob_templatefileid'}) //Change the Default Value When The Internal Id of CPM_PrintJob_PDF_Layout_HTML.html InternalId change 
    		});
    		var configRecObj = config.load({
    			type: config.Type.COMPANY_INFORMATION
    		});

			/******* Gets the companyLogo and place it in the header  *******/
    		var fileObj = file.load({
    			id:configRecObj.getValue('pagelogo')
    		}),
    		imageUrl = { urlPath: fileObj.url.replace(/&/g,'&amp;')}

			/******* Adding the record to HTML template  *******/
        	var myFile = render.create();
        	myFile.templateContent = templateFile.getContents();
        	myFile.addRecord('record', 
        		record.load({
        			type: record.Type.OPPORTUNITY,
        			id: context.request.parameters.recordId
        		})
        	);
        	myFile.addCustomDataSource({
        	    format: render.DataSource.OBJECT,
        	    alias: "imageObj",
        	    data: imageUrl
        	});
        	var template = myFile.renderAsPdf();
        	context.response.writeFile(template,true);
        	
    	}catch(e){
    		log.debug('Exception occures',e);
    	}    	
    }
    return {
        onRequest: onRequest
    };
    
});
