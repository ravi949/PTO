/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https','N/render','N/url','N/config','N/file','N/record','N/runtime'],

function(https,render,url,config,file,record,runtime) {
   
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
    		var request = context.request,response = context.response,
    		recordId = request.parameters.id,
    		type = request.parameters.type,template,
    		fileId,recordType;

    		log.debug('record id',request.parameters)

    		/******* loading the HTML template(CPM_PrintJob_PDF_Layout_HTML.html)  *******/
    		
    		if(type == 'opportunity'){
    			fileId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_templatefile'});
    			recordType = record.Type.OPPORTUNITY;
    		}else if(type == 'salesorder'){
    			fileId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_so_templatefile'});
    			recordType = record.Type.SALES_ORDER;
    		}else if(type == 'estimate'){
    			fileId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_qu_templatefile'});
    			recordType = record.Type.ESTIMATE;
    		}
    		
    		var templateFile = file.load({
    			id:fileId  
    		});
    		
    		var configRecObj = config.load({
    			type: config.Type.COMPANY_INFORMATION
    		});

    		/******* Gets the companyLogo and place it in the header  *******/
    		var fileObj = file.load({
    			id:configRecObj.getValue('pagelogo')
    		}),
    		imageUrl = { logoUrl: fileObj.url.replace(/&/g,'&amp;') };

    		/******* Adding the record to HTML template  *******/
    		var myFile = render.create();
    		myFile.templateContent = templateFile.getContents();
    		myFile.addRecord('record', 
    				record.load({
    					type:recordType,
    					id: recordId
    				})
    		);
    		myFile.addCustomDataSource({
    			format: render.DataSource.OBJECT,
    			alias: "companyInformation",
    			data: imageUrl
    		});
    		template = myFile.renderAsPdf();

    		var auth = request.parameters.token,
    		documentName = request.parameters.docName;
    		//make request
    		var headers = new Array();
    		headers["Authorization"] = 'Bearer ' + auth;
    		headers["Content-Type"] = 'text/plain;charset=UTF-8';

    		var rurl = "https://integrations.cudasign.com/netsuite/document/" + documentName + ".pdf/application%2Fpdf/" + recordId

    		var res = https.request({
    			method: https.Method.POST,
    			url: rurl,
    			body:template.getContents(),
    			headers:headers
    		});

    		log.debug('res',res)

    		//get the close iframe url
    		var closeIframePage = url.resolveScript({
    			scriptId:'customscript_signnow_closeiframe', 
    			deploymentId:'customdeploy_signnow_deploy_closeiframe', 
    			returnExternalUrl:false
    		});
    		response.write('<script>window.location = "https://app.cudasign.com/webapp/document/'+res.body+'?invite=true&access_token=' +auth+ '&redirect_uri=' + encodeURIComponent('https://' + request.url.split('/')[2] + closeIframePage) + '"</script>');

    	}catch(e){
    		log.error('e',e)
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
