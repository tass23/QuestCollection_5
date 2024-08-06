# QuestPackage5.8.6752
Custom version of Quest and Quest JS system for creating text adventures, and website conversion.
Quest 5.8.6752 was edited by KVonGit, and Raist.
QuestJS was edited by KVonGit, and Raist to convert Quest 5.8.6752 into an HTML file.

per the website: Quest lets you make interactive story games. Text adventure games like Zork and The Hitchhiker's Guide to the Galaxy. Gamebooks like the Choose Your Own Adventure and Fighting Fantasy books. You don't need to know how to program. All you need is a story to tell. Your game can be played anywhere. In a web browser, downloaded to a PC, or turned into an app.

This specific version supports custom modifications for: turn-based combat with spells and weapons, NPC party member, via the addtional libraries listed below.

Quest Default libraries:
Quest_Tracker_Lib
Score_Lib

Custom libraries:
Spells_Lib - Words of Power, based on UO, in the form of Commands. In general, players must type [spell _name] [object], where spell_name is the Command and object is the target of the spell.<br/><br/>Includes a popup window for displaying the "spellbook" with the Uses Remaining and the Words of Power. This popup is only available IF the player is carrying the spellbook, and the same can be said for using the Words of Power (they are only available if the player is carrying the spellbook).<br/><br/>Spells/Words of Power:<br/>Each spell accounts performs a check against the spell target to determine if that spell can be cast on it (mob=True/False). The next check is for resistance. UO has the following resists/damage types:<br/><br/>Physical<br/>Fire<br/>Cold<br/>Poison<br/>Energy<br/><br/>Each spell fits into a primary damage category, i.e. Vas Flam is Fireball, so it does Fire damage. If a mob has Fire resist lower than X, the spell is cast, does damage, and the mob's health drops accordingly. Otherwise, the spell simply fails. This system could be adjusted to subtract a percentage based on the resist value, which would allow for more variations of damage. However, since each spell has a variable damage range, a single resist check functions more easily.

TEHelp_Lib - The Expanse Offline Quest system complex HELP system.

TEItems_Lib - Weapons, based on UO, complete with magical properties. Incorporated into the Save/Load system which creates hash codes for Items to be Copy/Pasted to a text file to save it. Weapon Room contains ALL available weapons. Default images loaded for each weapon and weapon types are defined. NOTE: Additional properties have been added for Game Rooms, Mobs and Player, including Status attributes.

TEMainSysLib - The Expanse Offline Quest System Main Library contains commands, functions and other universal data needed for the OQS to function. The following is a mandatory list of Attributes to be added to objects and which type of objects receive which Attributes.<br><br><ul>Rooms<br><li>1. cycle INT - Used for handling respawns and increasing difficulty of respawns.</li><br><li>2. map & map_zoom STR - Used for handling the Map library and displaying images for each room.</li><br><li>3. mlist STRLIST - Used for handling the list of available targets to attack in a room.</li><br><li>4. Scripts - OnExit: ClearScreen, Enter: targets </li><br><li>5. Add Supply Shop exits to Main Room</li></ul><br><br><ul>NPC Questers<br><li>1. avquests INT - Displays Total Available quests.</li><br><li>2. tquests INT - Displays Total Quests for that NPC.</li></ul><br><br><ul>Mobs<br><li>1. mob type INT - Used to determine respawns and target functions.</li><br><li>2. lootable INT - Used to generate Loot after death. Does not work with Dispelled mobs.</li><br><li>3. status STR - Displays current mob status in the mob window when LOOKed at.</li><br><li>4. desclive STR - Message to display when mob is Alive.</li><br><li>5. descdead STR - Message to display when mob is dead.</li><br><li>6. img_dead STR - Direct path online to dead mob image.</li><br><li>7. defense type INT - Used during combat for Resists.</li></ul><br><br>

TEMap_Lib - Map library to use generic code to call pre-defined attributes on Rooms (room.map and room.map_zoom). room.map image should be full size map of that room or the whole area. room.map_zoom should be a scaled section of the main map that matches that specific room or area. Change display text as needed to match each map. Construct one map library for each game.

NPC_Lib - Easy NPC. Allows for the player to select an additional helper to join them. Complete with STATS PANE visible on the Right side, under the player STATS. Choose from Mage or Archer classes.
