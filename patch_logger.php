<?php

function patchFile($file, $action, $table, $recordIdStr, $oldDataStr, $newDataStr, $beforeStr, $authPath, $loggerPath) {
    if (!file_exists($file)) {
        echo "File not found: $file\n";
        return;
    }
    
    $content = file_get_contents($file);
    if (strpos($content, 'logger.php') !== false) {
        echo "Already patched: $file\n";
        return; 
    }

    $req = "";
    if (strpos($content, 'auth.php') === false) {
        $req .= "require_once '$authPath';\n";
    }
    $req .= "require_once '$loggerPath';\n";
    
    $content = preg_replace('/(require_once [^\n]+database\.php\';)/', "$1\n$req", $content);

    $log = "\n    log_activity(\$pdo, \$current_user_id ?? null, '$action', '$table', $recordIdStr, $oldDataStr, $newDataStr);\n";
    
    if (strpos($content, $beforeStr) !== false) {
        $content = str_replace($beforeStr, $log . "    " . $beforeStr, $content);
        file_put_contents($file, $content);
        echo "Successfully patched: $file\n";
    } else {
        echo "FAILED to find anchor string in: $file\n";
    }
}

$base = 'c:/xampp/htdocs/qwik-gold/api/';

patchFile($base.'loans/issue.php', 'ISSUE_LOAN', 'loans', '$loanId', 'null', "['principal' => \$principalAmount, 'customer_id' => \$customerId]", "// 3. Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'loans/repay_cash.php', 'REPAY_LOAN_CASH', 'loans', '$loanId', "['old_principal' => \$currentPrincipal]", "['new_principal' => \$newPrincipal, 'status' => \$newStatus]", "// 3. Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'loans/offset.php', 'OFFSET_LOAN_GOLD', 'loans', '$loanId', "['old_principal' => \$currentPrincipal]", "['new_principal' => \$newPrincipal]", "// Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'expenses/create.php', 'CREATE_EXPENSE', 'expenses', '$expenseId', 'null', "['amount' => \$amountGhs, 'description' => \$description]", "// 3. Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'sales/create.php', 'WALK_IN_PURCHASE', 'gold_purchases', '$purchaseId', 'null', "['grams' => \$weightGrams, 'paid' => \$totalPaidGhs]", "// 4. Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'sales/execute_market_sale.php', 'MARKET_SALE', 'capital_ledger', '1', 'null', "['actual_revenue' => \$actualRevenueGhs]", "// 4. Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'keepers/liquidate.php', 'LIQUIDATE_KEEPER', 'gold_purchases', '$purchaseId', 'null', "['grams_liquidated' => \$totalGramsSold, 'payout' => \$totalPayoutGhs]", "// 4. Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'capital/inject.php', 'INJECT_CAPITAL', 'capital_ledger', '1', 'null', "['amount' => \$amountGhs, 'source' => \$sourceDescription]", "// 4. Commit Transaction", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'keepers/deposit.php', 'DEPOSIT_KEEPER', 'gold_vault', '$pdo->lastInsertId()', 'null', "['grams' => \$weightGrams, 'type' => \$goldType]", "sendResponse('success', 'Gold deposited to keeper vault successfully'", "../middleware/auth.php", "../helpers/logger.php");
patchFile($base.'customers/create.php', 'CREATE_CUSTOMER', 'customers', '$customerId', 'null', "['name' => \$name, 'type' => \$type]", "sendResponse('success', 'Customer registered successfully'", "../middleware/auth.php", "../helpers/logger.php");

echo "Patching complete.\n";
