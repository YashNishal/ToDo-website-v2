//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});

const toDoSchema = {
  name: String
};

const listSchema = {
  name: String,
  item: [toDoSchema]
};

const Item = mongoose.model("item", toDoSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

function addDefaultItems() {
  Item.insertMany(defaultItems, (er) => {
    if (er) {
      console.log(er);
    } else {
      console.log("Added default items");
    }
  });
}

app.get("/", function (req, res) {

  Item.find({}, (er, result) => {
    if (result.length == 0) {
      addDefaultItems();
      res.redirect("/");

    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: result
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const _item = new Item({
    name: itemName
  });

  if(listName == "Today") {
    _item.save();
    res.redirect("/");
  } else {
    List.findOne({name : listName}, function(e, result){
      result.item.push(_item);
      result.save();
      res.redirect("/" + listName);
    });
  }
});


app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == "Today") {
    Item.findByIdAndRemove(checkedItemId, function (er) {
      if (er) {
        console.log(er);
      } else {
        console.log("Successfully deleted!");
      }
    });
  
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name : listName},{$pull : {item : {_id: checkedItemId}}}, function(err, result){
      if(!err) {
        res.redirect("/"+listName);
      }
    });
  }

  
});



app.get("/:customListName",function(req, res) {
  let customListName = _.capitalize(req.params.customListName);
  

  List.findOne({name : customListName}, function(er, result) {
    if(!er && !result) {
      // create a new list
      console.log("Doesn't exist!");

      const list = new List({
        name: customListName,
        item: defaultItems
      });
    
      list.save();
      res.redirect("/"+customListName);

    } else if( !er && result) {
      // show an existing list
      res.render("list",{
        listTitle: result.name,
        newListItems: result.item
      });
    }
  });

  
}); 


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});