/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget',
		'N/runtime',
		'N/redirect',
		'N/search',
		'N/record',
		'N/format',
		'N/file',
		'./CPM_CSVTOJSON_Module.js'],
/**
 * @param {serverWidget} serverWidget
 */
function(serverWidget,runtime,redirect,search,record,format,file,CSVTOJSON_Module) {

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
			userObj = runtime.getCurrentUser(),
			mainHeaders = ["Title/Description","Format","PageCount","Estimated Quantity","BRC Quantity"];
			if(request.method == 'GET'){
				
				var form = serverWidget.createForm({
					title:'Upload CSV File'
				});
				
				form.addField({
					id:'custpage_up_file',
					type:serverWidget.FieldType.FILE,
					label:'Upload File'
				});
				
				if(request.parameters.success){
					form.addField({
						id:'custpage_success_msg',
						type:serverWidget.FieldType.INLINEHTML,
						label:'success message'
					}).defaultValue = '<script language="javascript">require(["N/ui/message"],function(msg){msg.create({ title: "Confirmation", message: "File upload completed.", type: msg.Type.CONFIRMATION}).show(); window.history.pushState("page2", "Title", window.location.href.replace("&success=true",""));})</script>'
				}
				
					
				form.addSubmitButton('upload');
				form.addButton({
					id:'custpage_cancelbtn',
					label:'Cancel',
					functionName:'redirectToBack'
				})
				form.clientScriptModulePath  = './CPM_CC_Upload_PrintJob_Validations_cs_script.js'
				response.writePage(form);
				
			}else if(request.method == 'POST'){				
				var iterator = request.files.custpage_up_file.lines.iterator(),
				mandatoryFieldsIndexs = [];
				
				//headers validation
				iterator.each(function (e) {
				  var headers = e.value.split(','),  
				  lineCount = mainHeaders.length,headerFound = true;
				  for(var h = 0;h<lineCount;h++){
					 headerFound = headers.some(function(e){return e == mainHeaders[h]});
					 if(!headerFound){
						 throw Error('header missing');
					 }else{
						 switch(mainHeaders[h]){
						 case "PageCount":
							 mandatoryFieldsIndexs.push({index:headers.indexOf("PageCount"),field:"PageCount"});break;
						 case "Title/Description":
							 mandatoryFieldsIndexs.push({index:headers.indexOf("Title/Description"),field:"Title/Description"});break;
						 case "Format":
							 mandatoryFieldsIndexs.push({index:headers.indexOf("Format"),field:"Format"});break;
						 case "Estimated Quantity":
							 mandatoryFieldsIndexs.push({index:headers.indexOf("Estimated Quantity"),field:"Estimated Quantity"});break;
						 case "BRC Quantity":
							 mandatoryFieldsIndexs.push({index:headers.indexOf("BRC Quantity"),field:"BRC Quantity"});break;
						 }
					 }  
				  }
				  return false
				});
				
				
				//converting the csv to json object
				var scriptObj = runtime.getCurrentScript();
				var csvToJsonArr = new CSVTOJSON_Module.Base64().decode(request.files.custpage_up_file.getContents());
				csvToJsonArr = CSVTOJSON_Module.CSV2JSON(csvToJsonArr);
				var csvToJsonArrLength = csvToJsonArr.length;

				log.debug('csvToJsonArr',csvToJsonArr)
				//checking for the mandatory fields must have the value 
				for(var i = 0; i < csvToJsonArrLength;i++){
					for(var key in csvToJsonArr[i]){
						if(mandatoryFieldsIndexs.some(function(e){return e.field == key})){
							if(csvToJsonArr[i][key] == undefined || csvToJsonArr[i][key] == "" || csvToJsonArr[i][key] == null){
								throw {message:key,line:i+2};
							}
						}
					}
				}

				//check for the customer folder in file cabinet if not present create the new folder.
				var customerId = userObj.id;
				mainFolder = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_cc_uploadfolderid'}),
				filesFound = false;
				log.debug('customerId',customerId)
				search.create({
					type:search.Type.CUSTOMER,
					columns:['file.folder','file.name'],
					filters:[['internalid','is',customerId]]
				}).run().each(function(e){
					log.debug('name',e.getValue({name:'folder',join:'file'}))
					if(e.getText({name:'folder',join:'file'}) == customerId){
						customerFolderId = e.getValue({name:'folder',join:'file'});
						filesFound = true;
						return false;
					}
					return true
				})

				if(filesFound){
					request.files.custpage_up_file.folder = customerFolderId;
				}else{
					var createdFolderId = record.create({type:record.Type.FOLDER})
					.setValue({fieldId:'name',value:customerId.toString()})
					.setValue({fieldId:'parent',value:mainFolder}).save();
					request.files.custpage_up_file.folder = createdFolderId;
				}
				
				var formattedDateString = format.format({
	                value:new Date() ,
	                type: format.Type.DATE
	            });
				request.files.custpage_up_file.name = customerId+"_"+formattedDateString.split('/').join('')+"_"+request.files.custpage_up_file.name;
				var savedFileId = request.files.custpage_up_file.save();

				//attached the file to the customer 
				record.attach({
					record: {
						type: 'file',
						id: savedFileId
					},
					to: {
						type: 'customer',
						id: customerId
					}
				});

				redirect.toSuitelet({
					scriptId:scriptObj.id,
					deploymentId:scriptObj.deploymentId,
					parameters:{success:true}
				})	
			}
		}catch(e){
			if(mainHeaders.some(function(k){return k == e.message}))
				throw Error('Please Enter value for '+e.message+' at line '+e.line);
			else if(e.message == 'header missing')
				throw Error('Please provide the mandatory headers.');
			else if(e.message == 'file not matched')
				throw Error("Please upload the correct file.");
			else
				log.error('error',e.message)
		}
	}
	

	return {
		onRequest: onRequest
	};

});
