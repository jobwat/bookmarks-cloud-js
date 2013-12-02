// Insert your Dropbox app key here:
var DROPBOX_APP_KEY = 'okxx3x5p1xhktds';

// Exposed for easy access in the browser console.
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
var bookmarksTable;

$(function () {

  // Insert a new task record into the table.
  function insertBookmark(bookmark) {
    bookmarksTable.insert({
      title: bookmark.title,
      url: bookmark.url,
      text: bookmark.text,
      created: new Date(),
      updated: new Date()
    });
  }

  function updateList() {
    $('#bookmarks').empty();

    var records = bookmarksTable.query();

    $(records).each(function(index, record){
      var bookmark = {
        id: record.getId(),
        title: record.get('title'),
        url: record.get('url'),
        text: record.get('text'),
        created: record.get('created').toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+:\d+):\d+.*/, "$3/$2/$1 $4")
      };
      var template = '<tr id="{{id}}"><td class="title">{{title}}</td><td><a href="{{url}}">{{url}}</a></td><td class="comments">{{text}}</td><td>{{created}}</td><td><button class="delete">X</button></td></tr>';
      $('#bookmarks').append(Mustache.to_html(template, bookmark));
    });

    addListeners();
  }

  // The login button will start the authentication process.
  $('#loginButton').click(function (e) {
    e.preventDefault();
    // This will redirect the browser to OAuth login.
    client.authenticate();
  });

  // Try to finish OAuth authorization.
  client.authenticate({interactive:false}, function (error) {
    if (error) {
      alert('Authentication error: ' + error);
    }
  });

  if (client.isAuthenticated()) {
    // Client is authenticated. Display UI.
    $('#loginButton').hide();
    $('#main').show();

    client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
      if (error) {
        alert('Error opening default datastore: ' + error);
      }

      bookmarksTable = datastore.getTable('bookmarks');

      // Populate the initial task list.
      updateList();

      // Ensure that future changes update the list.
      datastore.recordsChanged.addListener(updateList);
    });
  }

  // Delete the record with a given ID.
  function deleteRecord(id) {
    bookmarksTable.get(id).deleteRecord();
  }

  // Update the record 'id' with the given hash
  function updateRecord(id, hash) {
    bookmarksTable.get(id).update(hash);
  }

  // Turn record line as editable
  function edit(id) {
    var tr = $('#bookmarks tr#'+id);
    tr.addClass('edit');
    var title = $('.title' ,tr).text();
    $('.title' ,tr) .empty() .append($('<input />', {type: 'text', value: title}));
    var comments = $('.comments' ,tr).text();
    $('.comments' ,tr).empty().append($('<textarea />').text(comments));
  }

  function saveEdits(){
    $('#bookmarks tr.edit').each(function(index, tr){
      var title = $('.title input' ,tr).val();
      $('.title' ,tr).empty().text(title);
      var comments = $('.comments textarea' ,tr).val();
      $('.comments' ,tr).empty().text(comments);
      updateRecord($(tr).attr('id'), { title: title, text: comments });
      $(tr).removeClass('edit');
    });
  }

  // Register event listeners to handle completing and deleting.
  function addListeners() {
    $('body').click(function (e) {
      e.preventDefault();
      console.log('body click');
      saveEdits();
    });
    $('button.delete').click(function (e) {
      e.preventDefault();
      var id = $(this).parents('tr').attr('id');
      deleteRecord(id);
    });
    $('.title, .comments').click(function(e) {
      e.preventDefault();
      e.stopPropagation();
      if($(this).parents('tr').hasClass('edit')){ return; }
      var id = $(this).parents('tr').attr('id');
      edit(id);
    });
  }

  // Hook form submit and add the new task.
  $('#addForm').submit(function (e) {
    var bookmark = {
      title: e.target.title.value,
      url: e.target.url.value,
      text: e.target.text.value
    };
    insertBookmark(bookmark);
    e.preventDefault();
    return false;
  });

  client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
    $('#status').text('In sync');
    datastore.syncStatusChanged.addListener(function () {
      if (datastore.getSyncStatus().uploading) {
        $('#status').text('Synchronizing...');
      } else {
        $('#status').text('In sync');
      }
    });
  });
});
