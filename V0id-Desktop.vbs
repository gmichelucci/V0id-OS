Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\V0id"
WshShell.Run "cmd /c ""C:\V0id\iniciar_v0id.bat""", 0, False
