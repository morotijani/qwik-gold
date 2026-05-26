<?php
$files = [
    'assets/js/modules/dashboard.js',
    'assets/js/modules/customers.js',
    'assets/js/modules/transactions.js'
];

$replacements = [
    '<i class="fa-solid fa-cart-shopping"></i>' => '<span class="material-symbols-outlined">shopping_cart</span>',
    '<i class="fa-solid fa-hand-holding-dollar"></i>' => '<span class="material-symbols-outlined">payments</span>',
    '<i class="fa-solid fa-scale-balanced"></i>' => '<span class="material-symbols-outlined">balance</span>',
    '<i class="fa-solid fa-building-columns"></i>' => '<span class="material-symbols-outlined">account_balance</span>',
    '<i class="fa-solid fa-spinner fa-spin"></i>' => '<span class="material-symbols-outlined spin">sync</span>',
    '<i class="fa-solid fa-money-bill-wave"></i>' => '<span class="material-symbols-outlined">payments</span>',
    '<i class="fa-solid fa-gem"></i>' => '<span class="material-symbols-outlined">diamond</span>',
    '<i class="fa-solid fa-plus"></i>' => '<span class="material-symbols-outlined">add</span>',
    '<i class="fa-solid fa-user-plus"></i>' => '<span class="material-symbols-outlined">person_add</span>',
    '<i class="fa-solid fa-arrow-left"></i>' => '<span class="material-symbols-outlined">arrow_back</span>',
    '<i class="fa-solid fa-save"></i>' => '<span class="material-symbols-outlined">save</span>',
    '<i class="fa-solid fa-spinner fa-spin fa-2x gold-text"></i>' => '<span class="material-symbols-outlined spin gold-text" style="font-size: 2rem;">sync</span>',
];

foreach ($files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        foreach ($replacements as $from => $to) {
            $content = str_replace($from, $to, $content);
        }
        file_put_contents($file, $content);
    }
}
echo "Icons patched successfully!";
