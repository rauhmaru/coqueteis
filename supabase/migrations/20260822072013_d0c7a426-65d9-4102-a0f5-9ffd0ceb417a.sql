insert into public.categorias (nome)
select v.nome from (values ('Laticínios'), ('Especiarias & Guarnições')) as v(nome)
where not exists (select 1 from public.categorias c where c.nome = v.nome);

update public.ingredientes i set categoria_id = (select id from public.categorias where nome = 'Laticínios')
where i.nome in ('Creme de leite','Iogurte natural','Leite condensado','Leite integral','Sorvete de baunilha','Creme de coco','Leite de coco');

update public.ingredientes i set categoria_id = (select id from public.categorias where nome = 'Espumantes & Refrigerantes')
where i.nome in ('Água','Água de coco','Chá de hibisco','Chá preto gelado');

update public.ingredientes i set categoria_id = (select id from public.categorias where nome = 'Ervas & Frutas')
where i.nome in ('Néctar de pêssego','Suco de tomate','Suco de uva','Suco de pepino fermentado');

update public.ingredientes i set categoria_id = (select id from public.categorias where nome = 'Especiarias & Guarnições')
where i.nome in ('Noz-moscada','Sal','Tabasco','Molho inglês','Chocolate em pó','Amêndoas','Cereja maraschino','Água de flor de laranjeira');
