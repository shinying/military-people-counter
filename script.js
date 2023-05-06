const OFFICER_BTN = "btn-outline-danger";
const OFFICER_BTN_SELECTED = "btn-danger";
const SERGENT_BTN = "btn-outline-info";
const SERGERT_BTN_SELECTED = "btn-info";
const SOILDER_BTN = "btn-outline-secondary";
const SOILDER_BTN_SELECTED = "btn-secondary";
const RANKS = ["#officer", "#sergeant", "#soilder"];
const BTN_CLASS = [OFFICER_BTN, SERGENT_BTN, SOILDER_BTN];
const BTN_SELECTED_CLASS = [OFFICER_BTN_SELECTED, SERGERT_BTN_SELECTED, SOILDER_BTN_SELECTED];


$(function() {
    let counts = 0;
    let member_num = [0, 0, 0];
    let member_rank = {};
    let selected_members = new Set();

    function read_from_local() {
        if (localStorage.length == 0)
            return;
        cache = [];
        for (let key in localStorage) {
            let item = localStorage.getItem(key);
            if (!item) continue;
            let member = JSON.parse(item);
            cache.push(member);
            counts = Math.max(counts, member["index"]);
        }
        if (!cache[0].hasOwnProperty("index") || !cache[0].hasOwnProperty("key")) {
            console.log("Clear localStorage")
            localStorage.clear();
            counts = 0;
            return;
        }
        cache.sort(function(a, b) { return a.index - b.index; });
        for (let member of cache) {
            add_member(member["name"], member["rank"], member["key"]);
            if (member["selected"]) {
                select_member($(`#${member["key"]}`));
            }
        }
    }
    read_from_local();

    function add_member(name, rank, hash="") {
        if (hash == "") {
            hash = MD5.generate(name);
        }
        let box = $("<div></div>").attr({
            class: "col-auto",
            id: `div-${hash}`,
        });
        let member = $(`<button>${name}</button>`).attr({
            type: "button",
            class: `btn ${BTN_CLASS[rank]}`,
            id: hash,
            "data-bs-toggle": "button",
        });
        member.click(select_member_event);

        box.append(member);
        $(`${RANKS[rank]}-list`).append(box);
        // $(RANKS[rank]+"label").removeClass("hidden");

        member_rank[hash] = rank;
        return hash;
    }

    function select_member_event() {
        select_member($(this));
        let id = $(this).attr("id");
        let data = JSON.parse(localStorage.getItem(id));
        data["selected"] = true;
        localStorage.setItem(id, JSON.stringify(data));
    }

    function select_member(member) {
        let rank = member_rank[member.attr("id")];
        // $(this).removeClass(BTN_CLASS[rank]).addClass(BTN_SELECTED_CLASS[rank]);
        member.addClass("active");
        member.off("click", select_member_event);
        member.click(deselect_member_event);

        member_num[rank]++;
        selected_members.add(member.attr("id"));
        update_ui(rank);
    }

    
    function deselect_member_event() {
        deselect_member($(this));
        let id = $(this).attr("id");
        let data = JSON.parse(localStorage.getItem(id));
        data["selected"] = false;
        localStorage.setItem(id, JSON.stringify(data));
    }

    function deselect_member(member) {
        let rank = member_rank[member.attr("id")];
        // $(this).removeClass(BTN_SELECTED_CLASS[rank]).addClass(BTN_CLASS[rank]);
        member.removeClass("active");
        member.off("click", deselect_member_event);
        member.click(select_member_event);

        member_num[rank]--;
        selected_members.delete(member.attr("id"));
        update_ui(rank);
    }


    function update_ui(rank=-1) {
        if (rank < 0) {
            for (let i = 0; i < member_num.length; i++) {
                $(`${RANKS[i]}-num`).text(member_num[i]);
            }
        } else {
            $(`${RANKS[rank]}-num`).text(member_num[rank]);
        }
        $("#total-num").text(selected_members.size);
    }


    function delete_members() {
        selected_members.forEach(member => {
            $(`#div-${member}`).remove();
            delete member_rank[member];
            localStorage.removeItem(member);
        });
        selected_members.clear();
        for (let i = 0; i < member_num.length; i++) {
            member_num[i] = 0;
        }
        update_ui();
    }

    let options_opened = false;
    $("#options-btn").click(function() {
        if (options_opened) {
            $("#add-member-div").hide();
            $("#add-reason-div").hide();
            $("#options-img").attr("src", "assets/options.png");
        } else {
            $("#add-member-div").show();
            $("#add-reason-div").show();
            $("#options-img").attr("src", "assets/options-selected.png");
        }
        options_opened = !options_opened;
    });

    $("#add-member-btn").click(function() {
        let name = $("#input-member").val();
        if (!name) {
            alert("請輸入人名");
            return;
        }
        let id = MD5.generate(name);
        if (id in member_rank) {
            alert("人名重複了");
            return;
        }
        let rank = parseInt($("#input-class option:selected").val());
        if (rank < 0) {
            alert("請選擇階級");
            return;
        }
        let hash = add_member(name, rank, id);        
        localStorage.setItem(id, JSON.stringify({
            "name": name,
            "rank": rank,
            "selected": false,
            "key": hash,
            "index": ++counts,
        }));
        $("#input-member").val('');
    });

    $("#delete-btn").click(delete_members);

    $("#delete-all-btn").click(function() {
        delete_members();
        for (const member in member_rank) {
            $(`#div-${member}`).remove();
            delete member_rank[member];
        }
        localStorage.clear();
        counts = 0;
    })
});