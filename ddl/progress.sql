create table progress
(
	user_id varchar(64) not null
		constraint progress_users_id_fk
		references users,
	word_id int not null
		constraint progress_words_id_fk
		references words,
	repeat_count smallint default 0 not null,
	updated_at datetimeoffset default getutcdate() not null,
	next_repeat datetimeoffset
)
go

create unique index progress_user_id_word_id_uindex
	on progress (user_id, word_id)
go

create index progress_next_repeat_index
	on progress (next_repeat)
go
