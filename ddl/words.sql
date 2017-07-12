create table words
(
  id int not null
    primary key,
  difficulty_level tinyint,
  word varchar(100) not null,
  json text not null
)
go
