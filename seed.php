<?php
// seed.php
require_once 'config/database.php';

$customers = [
    [
        'name' => 'Kwame Mensah',
        'business_name' => 'Mensah Gold Enterprise',
        'phone' => '0244123456',
        'email' => 'kwame.mensah@example.com',
        'address' => 'Tarkwa, Western Region',
        'type' => 'vip',
        'entity_type' => 'individual'
    ],
    [
        'name' => 'Abena Osei',
        'business_name' => '',
        'phone' => '0200987654',
        'email' => '',
        'address' => 'Obuasi, Ashanti Region',
        'type' => 'regular',
        'entity_type' => 'individual'
    ],
    [
        'name' => 'Asante Mining Group',
        'business_name' => 'Asante Mining Group Ltd',
        'phone' => '0302111222',
        'email' => 'info@asantemining.com',
        'address' => 'Kumasi, Adum',
        'type' => 'partner',
        'entity_type' => 'group'
    ],
    [
        'name' => 'Yaw Boakye',
        'business_name' => 'Boakye Miners',
        'phone' => '0241999888',
        'email' => '',
        'address' => 'Prestea',
        'type' => 'regular',
        'entity_type' => 'individual'
    ],
    [
        'name' => 'Akosua Darko',
        'business_name' => 'Darko & Sons Trading',
        'phone' => '0555333444',
        'email' => 'akosua.d@example.com',
        'address' => 'Bibiani',
        'type' => 'vip',
        'entity_type' => 'individual'
    ],
    [
        'name' => 'Golden Heritage Co.',
        'business_name' => 'Golden Heritage',
        'phone' => '0544555666',
        'email' => 'contact@goldenheritage.gh',
        'address' => 'Accra Central',
        'type' => 'partner',
        'entity_type' => 'group'
    ],
    [
        'name' => 'Kofi Annan',
        'business_name' => '',
        'phone' => '0277888999',
        'email' => 'kofi.a@example.com',
        'address' => 'Tarkwa',
        'type' => 'regular',
        'entity_type' => 'individual'
    ],
    [
        'name' => 'Amoah Syndicate',
        'business_name' => 'Amoah Small Scale',
        'phone' => '0200112233',
        'email' => '',
        'address' => 'Obuasi',
        'type' => 'regular',
        'entity_type' => 'group'
    ]
];

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("INSERT INTO customers (customer_uid, name, business_name, phone, email, address, type, entity_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($customers as $c) {
        // Generate UID: CUST-[YYYYMM]-[4 random chars]
        $prefix = "CUST-" . date('Ym');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4));
        $uid = $prefix . "-" . $random;
        
        $stmt->execute([
            $uid,
            $c['name'],
            $c['business_name'],
            $c['phone'],
            $c['email'],
            $c['address'],
            $c['type'],
            $c['entity_type']
        ]);
        
        echo "Inserted: " . $c['name'] . " (" . $uid . ")\n";
    }
    
    $pdo->commit();
    echo "\nSuccessfully seeded " . count($customers) . " customers!\n";
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error seeding data: " . $e->getMessage() . "\n";
}
