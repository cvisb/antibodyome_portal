var page = 1;
var id = -1;
var key = 'all';
var bucket_name = 'abome-test';

function acquire_project_data(){
	var data = {
        'title': $("#project-form #project-title").val(),
        'permission': $("#project-form #select-permission").val(),
        'organism': $("#project-form #select-organism").val(),
        'metadata': $("#project-form #platform").val(),
        'slug': $("#project-form #keywords").val(),
        'summary': $("#project-form #summary").val(),
        'samples':[]
    }
    $('.edit-project .sample-form').each(function(i){
        filename = ''
        if (id==-1) {
            var filename = $(this).closest('li').find('.qq-upload-file').text();
        }
        else {
            var filename = $("#sample-file-name").attr("value");
            if (filename==undefined) {
                filename = $(this).closest('li').find('.qq-upload-file').text();
            }
            // console.log(filename);

        }
        data.samples.push(
            {
                'name': $(this).find('#sample-name').val(),
                'description': $(this).find('#sample-description').val(),
                'filename': filename,
                'id': $(this).find('#sample-name').attr('data'),
                'uuid': $(this).next().attr('data')
            }
        );
    });
    console.log(data)
    return data;
}

$(document).ready(function() {

	var url=window.location.toString();
    var str="";
    var str_value="";
    if(url.indexOf("?")!=-1){
        var ary=url.split("?")[1].split("&");
        for(var i in ary){
            str=ary[i].split("=")[0];
            if (str == "id") {
                id = decodeURI(ary[i].split("=")[1]);
                $('#edit_or_new').text('Edit');
                $('.submit-btn').removeClass('disabled');
                renderProjectDetail(id);
            }
        }
    }

	renderProjectList(page, key);

    $('#manual-fine-uploader').fineUploaderS3({
        request : {
            endpoint : "abome-test.s3.amazonaws.com",
            accessKey : "AKIAIMPLN6YTZVD5Q3TA"
        },
        signature : {
            endpoint : "/upload/sign-policy"
        },
        objectProperties: {
            key: function(fileId) {
                var filename = $("#manual-fine-uploader").fineUploader("getName", fileId);
                var filename_temp = filename.split('.');
                var Suffix = filename_temp[filename_temp.length-1];
                var uuid = guid();
                var key = uuid;
                $('.name_'+fileId).attr('data',key);
                return key;
            }
        },
        retry : {
            showButton : true
        },
        // autoUpload : false,
        text : {
            uploadButton : '<a href="#" class="btn btn-default "> <span class="glyphicon glyphicon-plus"></span>samples</a>'
        },
        chunking : {
            enabled : true,
            partSize : 10 * 1024 * 1024
        },
        resume : {
            enabled : true
        },
        // deleteFile: {
        //     enabled: true,
        //     endpoint: "/upload/delete-file"
        // },
        validation : {
            itemLimit : 5,
            sizeLimit : 2 * 1024 * 1024 * 1024
        },
    })
    $('.qq-upload-button').css('border-bottom','none');
    $('.qq-progress-bar').css('height','3px');
    $('#manual-fine-uploader').on('submitted',function(id, name) {
        if(!$('.qq-upload-list').hasClass('well')){
            $('.qq-upload-list').addClass('well');
        }
        $(".qq-upload-list li").last().append($("#sample-detail").html());
        $(".qq-upload-list li").last().append('<div class="sample-name-div name_'+name+' hide"></div>');

        if(name%2) {
            $(".qq-upload-list li").last().css('background','#c0e0b1');
        }
        $.validate({});

        $('.del-sample').click(function(){
            $(this).closest('li').remove();
            delete_sample(this);
        });

        var name_div = $('.qq-upload-list .name_'+name);
        var progress_bar = name_div.closest("li").find(".qq-progress-bar");
        // progress_bar.removeClass("qq-progress-bar");
        // progress_bar.addClass('progress_bar');
        progress_bar.wrap('<div class="progress progress-striped active"></div>')
    });

    $.validate({});

    $('#triggerUpload').click(function() {
        var data = acquire_project_data();
        if (id==-1) {
            $.post(
                "/upload/create-project/",
                JSON.stringify(data),
                function(res){

                    if(res.status) {
                        window.location.href = "/web-app/project_detail.html?id=" + res.project_id;
                    }
                    else {
                        $('.error-tips').removeClass('hide');
                        $(".error-tips p").text(res.error);
                    }
                    $('#project-form').attr('data', res.project_id);
            });
        }
        else {
            $.post(
                '/upload/update-project/'+id,
                JSON.stringify(data),
                function(res){
                    if (res.status) {
                        window.location.href = "/web-app/project_detail.html?id=" + res.project_id;
                    }
                    else {
                        $('.error-tips').removeClass('hide');
                        $(".error-tips p").text(res.error);
                    }
                })
        }
        // $('#manual-fine-uploader').fineUploaderS3('uploadStoredFiles');
    });


   //  $('#start-analysis').click(function() {
   //      var id = $('#project-form').attr('data');
   //      $.ajax({
   //          url:"/upload/project-analysis/"+id+'/',
   //          type:'POST',
   //          data:null,
			// dataType: 'application/json',
			// timeout: 1000,
   //          success: function(res)
   //          	{},
   //          error: function(res)
	  //           {
	  //               if(res.status)
	  //               {
	  //                   var html = $("#project-tmpl").tmpl({'projects': res.projects});
	  //                   $('.edit-project').addClass('hide');
	  //                   $('#project-container').html(html);
	  //               }
	  //           }});
   //  });


    $('#manual-fine-uploader').on('complete', function(id, name){
        var name_div = $('.qq-upload-list .name_'+name);
        var completed = true;
        name_div.closest('li').find('.progress.progress-striped.active').addClass('hide');
        name_div.closest('li').removeClass('qq-upload-success');
        name_div.addClass('completed');
        $('.qq-upload-list').find('.sample-name-div').each(function(){
            if(!$(this).hasClass('completed')) {
                completed = false;
                return;

            }
        })
        if(completed) {
            $('.submit-btn').removeClass('disabled');
        }
    });

    $('.select-key').click(function(){
        renderProjectList(page, $(this).attr('data'));
    });


});

function delete_sample(self) {
    var parent = $(self).closest('.sample-form');
    // var uuid = parent.find("#sample-file-name").attr('data');
    var id = parent.find("#sample-name").attr('data');
    $.get(
        "/upload/delete-sample/"+id,
        function(res){
            if(res.status) {
                parent.remove();
            }
            else {
                $('.error-delete').removeClass('hide');
                $(".error-delete p").text(res.error);
            }
    });
}

function renderProjectList(page, key){
	$.get(
	"/upload/project-list/?page="+page+'&key='+key,
	function(res) {
        var html = $("#project-list-tmpl").tmpl({'projects': res.detail});
        $('#project-list').html(html);
        key = $('#select-key-group').find('.active').attr('data');
        if(res.prev == true)
        {
            $('.project_prev').css('display', 'block');
            $('.project_prev').click(function(){renderProjectList(page-1, key);});
        }
        if(res.next == true)
        {
            $('.project_next').css('display', 'block');
            $('.project_next').click(function(){renderProjectList(page+1, key);});
        }
    });
}


function renderProjectDetail(id){
    $.get(
        "/upload/project/"+id+'/',
        function(res){
            $('#project-title').val(res.title);
            $('#select-permission').val(res.permission);
            $('#select-organism').val(res.organism);
            $('#platform').val(res.metadata);
            $('#keywords').val(res.slug);
            $('#summary').val(res.summary);
            var html2 = $("#sample-list-tmpl").tmpl({'samples': res.samples});
            $('#sample-list-detail').html(html2);
            $('.sample-file-name').attr("disabled","disabled");
            $(".del-sample").click(function(){
                delete_sample(this);
            });
        });
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}