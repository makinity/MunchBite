import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🌱 Starting MunchBite Fresh Migration & Seed...\n");

  // 0. Clean Slate: Wipe Orders & Order Items
  console.log("🧹 Wiping previous orders & order items...");
  const { error: itemsErr } = await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (itemsErr) console.warn("   ⚠️ Order items wipe warning:", itemsErr.message);

  const { error: ordersErr } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (ordersErr) console.warn("   ⚠️ Orders wipe warning:", ordersErr.message);

  const { error: custErr } = await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (custErr) console.warn("   ⚠️ Customers wipe warning:", custErr.message);

  console.log("   ✅ Database tables wiped clean.\n");

  // 1. Seed Categories
  console.log("📁 Seeding Categories...");
  const categoriesData = [
    { id: "11111111-1111-1111-1111-111111111111", name: "Cookies" },
    { id: "22222222-2222-2222-2222-222222222222", name: "Brownies" },
    { id: "33333333-3333-3333-3333-333333333333", name: "Cupcakes" },
    { id: "44444444-4444-4444-4444-444444444444", name: "Bundles" },
  ];

  for (const cat of categoriesData) {
    const { data: existing } = await supabase.from("categories").select("id").eq("name", cat.name).maybeSingle();
    if (existing) {
      await supabase.from("categories").update({ name: cat.name }).eq("id", existing.id);
    } else {
      await supabase.from("categories").insert(cat);
    }
  }
  console.log("   ✅ 4 Categories ready.");

  // 2. Seed Products
  console.log("\n🍪 Seeding Products...");
  const productsData = [
    {
      name: "Choco Chip Cookies",
      description: "Classic golden-brown cookies packed with rich, gooey chocolate chips in every bite.",
      price: 60.0,
      image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80",
      category_id: "11111111-1111-1111-1111-111111111111",
      is_available: true,
      is_best_seller: true,
      stock: 50,
    },
    {
      name: "Fudge Brownies",
      description: "Decadent, fudgy chocolate squares with a shiny crinkle top and melt-in-your-mouth center.",
      price: 70.0,
      image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
      category_id: "22222222-2222-2222-2222-222222222222",
      is_available: true,
      is_best_seller: true,
      stock: 40,
    },
    {
      name: "Red Velvet Cupcakes",
      description: "Fluffy, moist red velvet sponge crowned with our signature whipped cream cheese frosting.",
      price: 65.0,
      image_url: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80",
      category_id: "33333333-3333-3333-3333-333333333333",
      is_available: true,
      is_best_seller: false,
      stock: 30,
    },
    {
      name: "MunchBite Treat Box (Assorted)",
      description: "The ultimate party sampler: 3 choco chip cookies, 2 fudge brownies, and 2 cupcakes in a gift box.",
      price: 150.0,
      image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      category_id: "44444444-4444-4444-4444-444444444444",
      is_available: true,
      is_best_seller: true,
      stock: 25,
    },
  ];

  for (const prod of productsData) {
    const { data: existing } = await supabase.from("products").select("id").eq("name", prod.name).maybeSingle();
    if (existing) {
      await supabase.from("products").update(prod).eq("id", existing.id);
    } else {
      await supabase.from("products").insert(prod);
    }
  }
  console.log("   ✅ Products ready.");

  // 3. Seed Reviews
  console.log("\n⭐ Seeding Customer Reviews...");
  const reviewsData = [
    { customer_name: "Sarah Jenkins", content: "The best cookies in town! Super soft inside with the perfect crunch on the edges.", rating: 5, is_published: true },
    { customer_name: "Mark Anthony", content: "The fudge brownies are dangerously addictive. Ordered for my team and they loved it!", rating: 5, is_published: true },
    { customer_name: "Chloe Mendoza", content: "Love the packaging and prompt delivery! The cupcakes are so light and not overly sweet.", rating: 5, is_published: true },
    { customer_name: "Dave Bautista", content: "Fast checkout with GCash and arrived warm. 10/10 will order again.", rating: 5, is_published: true },
  ];

  // Clean and re-seed reviews
  await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  for (const rev of reviewsData) {
    await supabase.from("reviews").insert(rev);
  }
  console.log("   ✅ Reviews ready.");

  // 4. Seed Admin Account (Auto-Confirmed)
  console.log("\n🛡️ Creating Admin Account (Auto-confirmed, no verification required)...");
  const adminEmail = "admin@munchbite.com";
  const adminPassword = "password123";

  const { data: usersList } = await supabase.auth.admin.listUsers({ perPage: 100 });
  let adminUser = usersList?.users?.find((u) => u.email === adminEmail);

  if (!adminUser) {
    const { data: newAdmin, error: adminErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: "admin",
        full_name: "Store Admin",
      },
    });
    if (adminErr) {
      console.warn("   Admin create error:", adminErr.message);
    } else {
      adminUser = newAdmin.user;
    }
  } else {
    await supabase.auth.admin.updateUserById(adminUser.id, {
      email_confirm: true,
      user_metadata: { role: "admin", full_name: "Store Admin" },
    });
  }

  if (adminUser) {
    await supabase.from("admins").upsert({
      id: adminUser.id,
      name: "Store Admin",
      email: adminEmail,
    });
    console.log(`   ✅ Admin: ${adminEmail} | Password: ${adminPassword}`);
  }

  // Also confirm and link denjikun1003@gmail.com if it exists
  const customAdminUser = usersList?.users?.find((u) => u.email === "denjikun1003@gmail.com");
  if (customAdminUser) {
    await supabase.auth.admin.updateUserById(customAdminUser.id, {
      email_confirm: true,
      user_metadata: { role: "admin", full_name: "Admin" },
    });
    await supabase.from("admins").upsert({
      id: customAdminUser.id,
      name: "Admin",
      email: "denjikun1003@gmail.com",
    });
    console.log("   ✅ Also granted Admin access to: denjikun1003@gmail.com");
  }

  // 5. Seed Customer Account (Auto-Confirmed)
  console.log("\n👤 Creating Customer Account (Auto-confirmed, no verification required)...");
  const customerEmail = "customer@munchbite.com";
  const customerPassword = "password123";

  let customerUser = usersList?.users?.find((u) => u.email === customerEmail);

  if (!customerUser) {
    const { data: newCust, error: custErr } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: customerPassword,
      email_confirm: true,
      user_metadata: {
        role: "customer",
        full_name: "Juan Dela Cruz",
        contact_number: "09171234567",
        address: "123 Sampaguita St, Davao City",
      },
    });
    if (custErr) {
      console.warn("   Customer create error:", custErr.message);
    } else {
      customerUser = newCust.user;
    }
  } else {
    await supabase.auth.admin.updateUserById(customerUser.id, {
      email_confirm: true,
      user_metadata: {
        role: "customer",
        full_name: "Juan Dela Cruz",
        contact_number: "09171234567",
        address: "123 Sampaguita St, Davao City",
      },
    });
  }

  if (customerUser) {
    await supabase.from("customers").upsert({
      user_id: customerUser.id,
      name: "Juan Dela Cruz",
      email: customerEmail,
      contact_number: "09171234567",
      address: "123 Sampaguita St, Davao City",
    });
    console.log(`   ✅ Customer: ${customerEmail} | Password: ${customerPassword}`);
  }

  console.log("\n🎉 Database fresh seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 LOGIN CREDENTIALS (Email confirmation disabled):");
  console.log("   🛡️ Admin Panel:    admin@munchbite.com    | password123");
  console.log("   👤 Customer Store:  customer@munchbite.com | password123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
