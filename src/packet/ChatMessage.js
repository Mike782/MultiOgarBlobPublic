﻿// Import
var BinaryWriter = require("./BinaryWriter");
var UserRoleEnum = require("../enum/UserRoleEnum");


function ChatMessage(sender, message, player) {
    this.sender = sender;
    this.message = message;
    this.sendUserID = player.sendUserID;
    this.sendPlayerID = player.userRole > UserRoleEnum.USER;
}

module.exports = ChatMessage;

ChatMessage.prototype.build = function (protocol) {
    var text = this.message;
    if (text == null) text = "";
    var name = "SERVER";
    var color = { 'r': 0x9B, 'g': 0x9B, 'b': 0x9B };
    if (this.sender != null) {
        name = this.sender.getName();
        if (name == null || name.length == 0) {
            if (this.sender.cells.length > 0)
                name = "An unnamed cell";
            else
                name = "Spectator";

        }
        if (this.sender.cells.length > 0) {
            color = this.sender.cells[0].getColor();
        }
    }
    
    var writer = new BinaryWriter();
    writer.writeUInt8(0x63);            // message id (decimal 99)
    
    // flags
    var flags = 0;
    if (this.sender == null)
        flags = 0x80;           // server message
    else if (this.sender.userRole == UserRoleEnum.ADMIN)
        flags = 0x40;           // admin message
    else if (this.sender.userRole == UserRoleEnum.MODER)
        flags = 0x20;           // moder message
    else if (this.sender.userRole == UserRoleEnum.USER) //youtuber
        flags = 0x08;           // youtuber message

    if (this.sendUserID && this.sender && this.sender.userID != 0){
        flags |= 0x10;
    }

    if (this.sender && this.sendPlayerID) { // must be send only to moderators
        flags |= 0x04;
    }
    if (this.sender && this.sender.showChatSuffix) {
        flags |= 0x02;
    }
    
    writer.writeUInt8(flags);
    writer.writeUInt8(color.r >> 0);
    writer.writeUInt8(color.g >> 0);
    writer.writeUInt8(color.b >> 0);

    if (this.sendUserID && this.sender && this.sender.userID != 0){
        writer.writeDouble(this.sender.userID);
    }
    
    if (this.sender && this.sendPlayerID) { //sending player ID to moderators
        writer.writeUInt32(this.sender.pID);
    }    
    
    if (protocol <= 5) {
        writer.writeStringZeroUnicode(name);
        writer.writeStringZeroUnicode(text);
    } else {
        writer.writeStringZeroUtf8(name);
        writer.writeStringZeroUtf8(text);
    }
    return writer.toBuffer();
};