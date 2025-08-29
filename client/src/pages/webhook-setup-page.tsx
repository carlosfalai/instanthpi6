import React from "react";
import { Webhook } from "lucide-react";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function WebhookSetupPage() {
  const { toast } = useToast();

  const appsScriptCode = `// Google Apps Script - InstantHPI™ Webhook Notifier
// Version 1.4 - Webhook Only Version
// This script only sends webhooks to your local server for instant processing

// Configuration
const CONFIG = {
  WEBHOOK_URL: 'http://192.168.2.219:3003/webhook', // Change to your server IP
  VERSION: '1.4',
  DONATION_LINK: 'https://buy.stripe.com/bJe00ibGOcGvbcF55UaMU00'
};

// Configuration des déclencheurs automatiques
function setupTriggers() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Supprimer les déclencheurs existants
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
    
    // Créer déclencheur webhook pour traitement instantané
    ScriptApp.newTrigger('sendInstantTriageWebhook')
      .forSpreadsheet(sheet)
      .onChange()
      .create();
    
    // Afficher confirmation si UI disponible
    try {
      SpreadsheetApp.getUi().alert('✅ Webhook InstantHPI™ Activé', 
        'Le système enverra maintenant une notification instantanée à votre serveur local quand une nouvelle ligne est ajoutée.\n\n' +
        'Serveur webhook: ' + CONFIG.WEBHOOK_URL + '\n\n' +
        'Assurez-vous que votre serveur InstantTriage est en cours d\'exécution!\n\n' +
        '💙 Service GRATUIT - Donations volontaires acceptées\n' +
        CONFIG.DONATION_LINK, 
        SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (uiError) {
      console.log('UI non disponible - triggers configurés avec succès');
    }
  } catch (error) {
    console.error('Erreur configuration triggers:', error);
    throw error;
  }
}

// Fonction webhook pour traitement instantané
function sendInstantTriageWebhook(e) {
  // Vérifier si c'est un changement pertinent
  if (e && e.changeType !== 'INSERT_ROW' && e.changeType !== 'EDIT' && e.changeType !== 'OTHER') {
    return;
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // Créer le payload avec les informations de base
    const payload = {
      timestamp: new Date().toISOString(),
      trigger: 'sheet_change',
      changeType: e ? e.changeType : 'manual',
      lastRow: lastRow,
      sheetName: sheet.getName(),
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
    };
    
    // Envoyer le webhook
    const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      console.log('Webhook envoyé avec succès à', CONFIG.WEBHOOK_URL);
    } else {
      console.error('Erreur webhook:', response.getResponseCode(), response.getContentText());
    }
    
  } catch (error) {
    console.error('Erreur envoi webhook:', error);
    // Ne pas faire échouer silencieusement - logger l'erreur
    logWebhookError(error);
  }
}

// Logger les erreurs webhook
function logWebhookError(error) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Webhook_Errors');
    
    if (!errorSheet) {
      // Créer une feuille d'erreurs si elle n'existe pas
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Webhook_Errors');
      newSheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Error', 'Details']]);
    }
    
    const errorLog = errorSheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Webhook_Errors');
    errorLog.appendRow([
      new Date().toISOString(),
      error.toString(),
      CONFIG.WEBHOOK_URL
    ]);
  } catch (e) {
    console.error('Impossible de logger l\'erreur webhook:', e);
  }
}

// Tester manuellement le webhook
function testWebhook() {
  try {
    sendInstantTriageWebhook({ changeType: 'manual_test' });
    SpreadsheetApp.getUi().alert('✅ Test Webhook', 
      'Webhook envoyé avec succès à:\n' + CONFIG.WEBHOOK_URL + '\n\n' +
      'Vérifiez votre serveur pour confirmer la réception.', 
      SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erreur Test Webhook', 
      'Erreur lors de l\'envoi du webhook:\n' + error.toString() + '\n\n' +
      'Vérifiez que votre serveur est en cours d\'exécution à:\n' + CONFIG.WEBHOOK_URL, 
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// Menu principal
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏥 InstantHPI Webhook')
    .addItem('▶️ Activer webhook automatique', 'setupTriggers')
    .addItem('🧪 Tester webhook maintenant', 'testWebhook')
    .addItem('ℹ️ Vérifier configuration', 'checkWebhookConfig')
    .addItem('📋 Voir erreurs webhook', 'viewWebhookErrors')
    .addItem('🔍 Vérifier mapping colonnes', 'testColumnMapping')
    .addSeparator()
    .addItem('⛔ Désactiver webhook', 'disableTriggers')
    .addToUi();
}

// Vérifier la configuration webhook
function checkWebhookConfig() {
  const triggers = ScriptApp.getProjectTriggers();
  const hasWebhookTrigger = triggers.some(t => t.getHandlerFunction() === 'sendInstantTriageWebhook');
  
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  let message = 'Configuration Webhook InstantHPI\n';
  message += '================================\n\n';
  message += 'Version: ' + CONFIG.VERSION + '\n';
  message += 'URL Webhook: ' + CONFIG.WEBHOOK_URL + '\n';
  message += 'Webhook actif: ' + (hasWebhookTrigger ? 'OUI ✅' : 'NON ❌') + '\n';
  message += 'Dernière ligne: ' + lastRow + '\n\n';
  message += 'Instructions:\n';
  message += '1. Assurez-vous que votre serveur est lancé\n';
  message += '2. Le serveur doit écouter sur le port 3003\n';
  message += '3. Ajoutez une ligne pour déclencher le webhook\n\n';
  message += '💙 SERVICE GRATUIT\n';
  message += 'Donations: ' + CONFIG.DONATION_LINK;
  
  SpreadsheetApp.getUi().alert('Configuration Webhook', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

// Voir les erreurs webhook
function viewWebhookErrors() {
  const errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Webhook_Errors');
  
  if (!errorSheet) {
    SpreadsheetApp.getUi().alert('Aucune erreur', 
      'Aucune erreur webhook enregistrée.', 
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  // Activer la feuille d'erreurs
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(errorSheet);
  SpreadsheetApp.getUi().alert('Erreurs Webhook', 
    'La feuille des erreurs webhook est maintenant active.\n' +
    'Vous pouvez voir l\'historique des erreurs.', 
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// Désactiver les triggers
function disableTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  SpreadsheetApp.getUi().alert('Webhook désactivé', 
    'Le webhook automatique est maintenant désactivé.\n' +
    'Les nouvelles lignes ne déclencheront plus de notifications.', 
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// Fonction simple pour notifier d'une nouvelle ligne (alternative)
function notifyNewRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    console.log('Pas de nouvelles données');
    return;
  }
  
  // Obtenir les données de base de la dernière ligne
  const email = sheet.getRange(lastRow, 3).getValue(); // Colonne C
  
  console.log('Nouvelle ligne détectée:', {
    row: lastRow,
    email: email,
    timestamp: new Date().toISOString()
  });
  
  // Envoyer webhook simple
  sendInstantTriageWebhook({ changeType: 'new_row' });
}

// Fonction de test pour vérifier le mapping des colonnes
function testColumnMapping() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, 30).getValues()[0];
  
  let message = 'Mapping des colonnes:\n\n';
  headers.forEach((header, index) => {
    if (header) {
      message += 'Colonne ' + String.fromCharCode(65 + index) + ' (' + (index + 1) + '): ' + header + '\n';
    }
  });
  
  // Ajouter le mapping attendu
  message += '\n\nMapping utilisé par le serveur:\n';
  message += 'C: Email\n';
  message += 'D: Patient ID\n';
  message += 'E: Gender\n';
  message += 'F: Age\n';
  message += 'G: What brings you to clinic\n';
  message += 'H: When did this start (Onset)\n';
  message += 'I: Specific trigger (Provocation)\n';
  message += 'J: Where is symptom (Region)\n';
  message += 'K: How describe symptom (Quality)\n';
  message += 'L: What makes worse\n';
  message += 'M: What relieves\n';
  message += 'N: Scale 0-10 (Severity)\n';
  message += 'O: How evolved (Time)\n';
  message += 'P: Other symptoms\n';
  message += 'Q: Tried treatments\n';
  message += 'R: Were effective\n';
  message += 'S: Chronic conditions\n';
  message += 'T: Allergies\n';
  message += 'U: Pregnant/Breastfeeding\n';
  message += 'V: Anything else\n';
  
  SpreadsheetApp.getUi().alert('Vérification du mapping', message, SpreadsheetApp.getUi().ButtonSet.OK);
}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      toast({ title: "Copied", description: "Apps Script code copied to clipboard" });
    } catch (e) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayoutSpruce>
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            InstantHPI Webhook (Google Apps Script)
          </h1>
          <p className="text-muted-foreground">
            Paste the following code in your Google Apps Script editor to enable instant webhook
            notifications from Google Sheets to your local server.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              InstantHPI™ Webhook Notifier v1.4
            </CardTitle>
            <CardDescription>
              Set <code>CONFIG.WEBHOOK_URL</code> to your server (default shown is{" "}
              <code>http://192.168.2.219:3003/webhook</code>). Then run <code>setupTriggers</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-2">
              <Button onClick={copyToClipboard} size="sm">
                Copy Code
              </Button>
            </div>
            <pre className="bg-[#0f172a] text-[#e2e8f0] p-4 rounded-md overflow-auto text-xs leading-relaxed border border-border">
              <code>{appsScriptCode}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppLayoutSpruce>
  );
}
